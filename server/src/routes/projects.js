const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Project = require('../models/Project');
const Task = require('../models/Task');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// GET /api/projects — list all projects for current user
router.get('/', async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [{ owner: req.user._id }, { members: req.user._id }],
    }).populate('owner', 'name email avatar').sort('-createdAt');

    // Attach task stats to each project
    const projectsWithStats = await Promise.all(projects.map(async (project) => {
      const tasks = await Task.find({ project: project._id });
      const total = tasks.length;
      const done = tasks.filter(t => t.status === 'done').length;
      return {
        ...project.toObject(),
        taskStats: { total, done, inProgress: tasks.filter(t => t.status === 'in-progress').length, todo: tasks.filter(t => t.status === 'todo').length },
        progress: total > 0 ? Math.round((done / total) * 100) : 0,
      };
    }));

    res.json(projectsWithStats);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/projects — create project
router.post('/', [
  body('name').trim().notEmpty().withMessage('Project name is required').isLength({ max: 100 }),
  body('description').optional().isLength({ max: 500 }),
  body('deadline').optional().isISO8601().withMessage('Invalid deadline date'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }

  try {
    const { name, description, color, deadline } = req.body;
    const project = await Project.create({
      name,
      description,
      color: color || '#6366f1',
      deadline,
      owner: req.user._id,
      members: [req.user._id],
    });
    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/projects/:id
router.get('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate('owner', 'name email avatar').populate('members', 'name email avatar');
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const isOwnerOrMember = project.owner._id.equals(req.user._id) || project.members.some(m => m._id.equals(req.user._id));
    if (!isOwnerOrMember) return res.status(403).json({ message: 'Access denied' });

    const tasks = await Task.find({ project: project._id }).populate('assignee', 'name email avatar').sort('createdAt');
    const total = tasks.length;
    const done = tasks.filter(t => t.status === 'done').length;

    res.json({
      ...project.toObject(),
      tasks,
      taskStats: { total, done, inProgress: tasks.filter(t => t.status === 'in-progress').length, todo: tasks.filter(t => t.status === 'todo').length },
      progress: total > 0 ? Math.round((done / total) * 100) : 0,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PUT /api/projects/:id
router.put('/:id', [
  body('name').optional().trim().notEmpty().isLength({ max: 100 }),
  body('description').optional().isLength({ max: 500 }),
  body('deadline').optional().isISO8601(),
  body('status').optional().isIn(['active', 'completed', 'on-hold', 'cancelled']),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }

  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (!project.owner.equals(req.user._id)) return res.status(403).json({ message: 'Only owner can edit project' });

    const { name, description, color, deadline, status } = req.body;
    if (name !== undefined) project.name = name;
    if (description !== undefined) project.description = description;
    if (color !== undefined) project.color = color;
    if (deadline !== undefined) project.deadline = deadline;
    if (status !== undefined) project.status = status;

    await project.save();
    res.json(project);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// DELETE /api/projects/:id
router.delete('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (!project.owner.equals(req.user._id)) return res.status(403).json({ message: 'Only owner can delete project' });

    await Task.deleteMany({ project: project._id });
    await project.deleteOne();
    res.json({ message: 'Project deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
