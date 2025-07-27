const mongoose = require('mongoose');

const gradeDataSchema = new mongoose.Schema({
  grade: {
    type: String,
    required: true
  },
  totalStudents: {
    type: Number,
    required: true,
    min: 0
  },
  affectedStudents: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: false });

const totalsSchema = new mongoose.Schema({
  totalStudents: {
    type: Number,
    required: true,
    min: 0
  },
  totalAffected: {
    type: Number,
    required: true,
    min: 0
  },
  percentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  }
}, { _id: false });

const impactAssessmentSchema = new mongoose.Schema({
  // School Information
  schoolName: {
    type: String,
    required: true,
    trim: true
  },
  schoolType: {
    type: String,
    required: true,
    enum: ['primary', 'lower-secondary', 'upper-secondary', 'high-school', 'technical', 'university', 'pagoda']
  },
  
  // Location Information
  province: {
    type: String,
    required: true,
    enum: ['banteay-meanchey', 'battambang', 'pailin', 'oddar-meanchey', 'preah-vihear', 'stung-treng', 'ratanakiri', 'mondulkiri']
  },
  district: {
    type: String,
    required: true
  },
  commune: {
    type: String,
    required: true
  },
  village: {
    type: String,
    required: true
  },
  
  // Student Impact Data
  gradeData: [gradeDataSchema],
  totals: totalsSchema,
  
  // Impact Details
  impactTypes: [{
    type: String,
    enum: ['school-closure', 'student-evacuation', 'teacher-absence', 'infrastructure-damage', 
           'learning-disruption', 'psychological-impact', 'material-shortage', 'other']
  }],
  severity: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  incidentDate: {
    type: Date,
    required: true
  },
  duration: {
    type: Number,
    min: 0
  },
  teacherAffected: {
    type: Number,
    min: 0,
    default: 0
  },
  
  // Additional Information
  contactInfo: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  
  // Submission Metadata
  submittedBy: {
    type: String,
    default: 'Anonymous'
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  
  // Status for workflow
  status: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedAt: {
    type: Date
  },
  verificationNotes: {
    type: String
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
impactAssessmentSchema.index({ province: 1, incidentDate: -1 });
impactAssessmentSchema.index({ severity: 1 });
impactAssessmentSchema.index({ schoolType: 1 });
impactAssessmentSchema.index({ status: 1 });
impactAssessmentSchema.index({ submittedAt: -1 });

// Virtual for unique reference ID
impactAssessmentSchema.virtual('referenceId').get(function() {
  return `IA-${this.createdAt.getFullYear()}-${this._id.toString().slice(-6).toUpperCase()}`;
});

// Ensure virtual fields are serialized
impactAssessmentSchema.set('toJSON', {
  virtuals: true
});

// Pre-save validation
impactAssessmentSchema.pre('save', function(next) {
  // Validate that affected students don't exceed total students
  if (this.gradeData && this.gradeData.length > 0) {
    for (const grade of this.gradeData) {
      if (grade.affectedStudents > grade.totalStudents) {
        return next(new Error(`Affected students (${grade.affectedStudents}) cannot exceed total students (${grade.totalStudents}) for grade ${grade.grade}`));
      }
    }
  }
  
  // Recalculate totals
  if (this.gradeData && this.gradeData.length > 0) {
    const totalStudents = this.gradeData.reduce((sum, grade) => sum + grade.totalStudents, 0);
    const totalAffected = this.gradeData.reduce((sum, grade) => sum + grade.affectedStudents, 0);
    const percentage = totalStudents > 0 ? Math.round((totalAffected / totalStudents) * 100) : 0;
    
    this.totals = {
      totalStudents,
      totalAffected,
      percentage
    };
  }
  
  next();
});

// Static methods for aggregation
impactAssessmentSchema.statics.getStatistics = async function(filters = {}) {
  const matchStage = {};
  
  if (filters.province) matchStage.province = filters.province;
  if (filters.severity) matchStage.severity = filters.severity;
  if (filters.startDate || filters.endDate) {
    matchStage.incidentDate = {};
    if (filters.startDate) matchStage.incidentDate.$gte = new Date(filters.startDate);
    if (filters.endDate) matchStage.incidentDate.$lte = new Date(filters.endDate);
  }
  if (filters.status) matchStage.status = filters.status;
  
  const stats = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalReports: { $sum: 1 },
        totalAffectedStudents: { $sum: '$totals.totalAffected' },
        totalAffectedTeachers: { $sum: '$teacherAffected' },
        uniqueSchools: { $addToSet: '$schoolName' }
      }
    }
  ]);
  
  const byProvince = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$province',
        count: { $sum: 1 },
        affectedStudents: { $sum: '$totals.totalAffected' }
      }
    }
  ]);
  
  const bySeverity = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$severity',
        count: { $sum: 1 },
        affectedStudents: { $sum: '$totals.totalAffected' }
      }
    }
  ]);
  
  const bySchoolType = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$schoolType',
        count: { $sum: 1 },
        affectedStudents: { $sum: '$totals.totalAffected' }
      }
    }
  ]);
  
  const byMonth = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: {
          year: { $year: '$incidentDate' },
          month: { $month: '$incidentDate' }
        },
        count: { $sum: 1 },
        affectedStudents: { $sum: '$totals.totalAffected' }
      }
    },
    { $sort: { '_id.year': -1, '_id.month': -1 } },
    { $limit: 12 }
  ]);
  
  return {
    totalReports: stats[0]?.totalReports || 0,
    affectedSchools: stats[0]?.uniqueSchools?.length || 0,
    totalAffectedStudents: stats[0]?.totalAffectedStudents || 0,
    totalAffectedTeachers: stats[0]?.totalAffectedTeachers || 0,
    byProvince: byProvince.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {}),
    bySeverity: bySeverity.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {}),
    bySchoolType: bySchoolType.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {}),
    byMonth: byMonth.map(item => ({
      month: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
      count: item.count,
      affectedStudents: item.affectedStudents
    }))
  };
};

const ImpactAssessment = mongoose.model('ImpactAssessment', impactAssessmentSchema);

module.exports = ImpactAssessment;