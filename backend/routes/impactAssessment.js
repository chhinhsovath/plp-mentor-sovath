const express = require('express');
const router = express.Router();
const ImpactAssessment = require('../models/ImpactAssessment');
const auth = require('../middleware/auth');
const { Parser } = require('json2csv');

// Public route - Create new impact assessment (no auth required)
router.post('/', async (req, res) => {
  try {
    const assessment = new ImpactAssessment(req.body);
    await assessment.save();
    res.status(201).json({
      success: true,
      data: assessment,
      message: 'Impact assessment submitted successfully'
    });
  } catch (error) {
    console.error('Error creating impact assessment:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Get all impact assessments with filters (requires auth for ministry users)
router.get('/', auth, async (req, res) => {
  try {
    const {
      province,
      severity,
      startDate,
      endDate,
      schoolType,
      status,
      page = 1,
      limit = 10,
      sortBy = 'submittedAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    if (province) filter.province = province;
    if (severity) filter.severity = parseInt(severity);
    if (schoolType) filter.schoolType = schoolType;
    if (status) filter.status = status;
    
    if (startDate || endDate) {
      filter.incidentDate = {};
      if (startDate) filter.incidentDate.$gte = new Date(startDate);
      if (endDate) filter.incidentDate.$lte = new Date(endDate);
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    // Execute query
    const [assessments, total] = await Promise.all([
      ImpactAssessment.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .populate('verifiedBy', 'name email'),
      ImpactAssessment.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: assessments,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching impact assessments:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get statistics (requires auth)
router.get('/statistics', auth, async (req, res) => {
  try {
    const { province, severity, startDate, endDate, status } = req.query;
    const filters = {};
    
    if (province) filters.province = province;
    if (severity) filters.severity = parseInt(severity);
    if (status) filters.status = status;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const statistics = await ImpactAssessment.getStatistics(filters);
    
    res.json({
      success: true,
      data: statistics
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get single impact assessment by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const assessment = await ImpactAssessment.findById(req.params.id)
      .populate('verifiedBy', 'name email role');
    
    if (!assessment) {
      return res.status(404).json({
        success: false,
        error: 'Impact assessment not found'
      });
    }

    res.json({
      success: true,
      data: assessment
    });
  } catch (error) {
    console.error('Error fetching impact assessment:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update impact assessment (requires auth)
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Remove fields that shouldn't be updated directly
    delete updates._id;
    delete updates.createdAt;
    delete updates.submittedAt;

    const assessment = await ImpactAssessment.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    );

    if (!assessment) {
      return res.status(404).json({
        success: false,
        error: 'Impact assessment not found'
      });
    }

    res.json({
      success: true,
      data: assessment,
      message: 'Impact assessment updated successfully'
    });
  } catch (error) {
    console.error('Error updating impact assessment:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Delete impact assessment (requires auth and admin role)
router.delete('/:id', auth, async (req, res) => {
  try {
    // Check if user has admin role
    if (!['administrator', 'zone', 'provincial'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions to delete impact assessments'
      });
    }

    const assessment = await ImpactAssessment.findByIdAndDelete(req.params.id);

    if (!assessment) {
      return res.status(404).json({
        success: false,
        error: 'Impact assessment not found'
      });
    }

    res.json({
      success: true,
      message: 'Impact assessment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting impact assessment:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Verify/Approve impact assessment (requires auth)
router.post('/:id/verify', auth, async (req, res) => {
  try {
    const { status, verificationNotes } = req.body;

    if (!['verified', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be either "verified" or "rejected"'
      });
    }

    const assessment = await ImpactAssessment.findByIdAndUpdate(
      req.params.id,
      {
        status,
        verifiedBy: req.user.id,
        verifiedAt: new Date(),
        verificationNotes
      },
      { new: true }
    ).populate('verifiedBy', 'name email');

    if (!assessment) {
      return res.status(404).json({
        success: false,
        error: 'Impact assessment not found'
      });
    }

    res.json({
      success: true,
      data: assessment,
      message: `Impact assessment ${status} successfully`
    });
  } catch (error) {
    console.error('Error verifying impact assessment:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Export to CSV (requires auth)
router.get('/export/csv', auth, async (req, res) => {
  try {
    const { province, severity, startDate, endDate, status } = req.query;

    // Build filter
    const filter = {};
    if (province) filter.province = province;
    if (severity) filter.severity = parseInt(severity);
    if (status) filter.status = status;
    
    if (startDate || endDate) {
      filter.incidentDate = {};
      if (startDate) filter.incidentDate.$gte = new Date(startDate);
      if (endDate) filter.incidentDate.$lte = new Date(endDate);
    }

    const assessments = await ImpactAssessment.find(filter)
      .sort({ submittedAt: -1 })
      .lean();

    // Flatten data for CSV
    const csvData = assessments.map(a => ({
      'លេខសម្គាល់': a._id,
      'កាលបរិច្ឆេទបញ្ជូន': new Date(a.submittedAt).toLocaleDateString('km-KH'),
      'ឈ្មោះសាលា': a.schoolName,
      'ប្រភេទសាលា': a.schoolType,
      'ខេត្ត': a.province,
      'ស្រុក': a.district,
      'ឃុំ': a.commune,
      'ភូមិ': a.village,
      'សិស្សសរុប': a.totals.totalStudents,
      'សិស្សរងផលប៉ះពាល់': a.totals.totalAffected,
      'ភាគរយ': `${a.totals.percentage}%`,
      'គ្រូរងផលប៉ះពាល់': a.teacherAffected || 0,
      'កម្រិតធ្ងន់ធ្ងរ': a.severity,
      'កាលបរិច្ឆេទកើតហេតុ': new Date(a.incidentDate).toLocaleDateString('km-KH'),
      'រយៈពេល(ថ្ងៃ)': a.duration || '',
      'ប្រភេទផលប៉ះពាល់': a.impactTypes.join(', '),
      'ស្ថានភាព': a.status,
      'ពិពណ៌នា': a.description || ''
    }));

    const fields = Object.keys(csvData[0] || {});
    const opts = { fields, withBOM: true };
    const parser = new Parser(opts);
    const csv = parser.parse(csvData);

    res.header('Content-Type', 'text/csv; charset=utf-8');
    res.attachment(`impact-assessment-${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csv);
  } catch (error) {
    console.error('Error exporting to CSV:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Bulk operations (requires auth and admin role)
router.post('/bulk/delete', auth, async (req, res) => {
  try {
    if (!['administrator', 'zone', 'provincial'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions for bulk operations'
      });
    }

    const { ids } = req.body;
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Please provide an array of IDs'
      });
    }

    const result = await ImpactAssessment.deleteMany({ _id: { $in: ids } });

    res.json({
      success: true,
      message: `${result.deletedCount} impact assessments deleted successfully`
    });
  } catch (error) {
    console.error('Error in bulk delete:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;