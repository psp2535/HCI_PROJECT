import Student from '../models/Student.js';
import Registration from '../models/Registration.js';

/**
 * Promote students to next semester
 * Requirements:
 * - Increment currentSemester by 1
 * - Max semester = 8
 * - Only promote students with overallStatus = "final_approved" in their latest registration
 * - Prevent double promotion using lastPromotedAt
 */
export const promoteStudentsToNextSemester = async (filters = {}) => {
  try {
    const currentDate = new Date();
    const oneMonthAgo = new Date(currentDate);
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    // Build query for eligible students
    const query = {
      currentSemester: { $lt: 8 }, // Not already at max semester
      $or: [
        { lastPromotedAt: { $exists: false } }, // Never promoted
        { lastPromotedAt: { $lt: oneMonthAgo } } // Not promoted in last month
      ]
    };

    // Add optional filters
    if (filters.program) query.program = filters.program;
    if (filters.batchYear) query.batchYear = filters.batchYear;

    // Find eligible students
    const eligibleStudents = await Student.find(query).select('_id currentSemester');
    
    if (eligibleStudents.length === 0) {
      return { 
        success: true, 
        promoted: 0, 
        message: 'No eligible students found for promotion' 
      };
    }

    const studentIds = eligibleStudents.map(s => s._id);

    // Check which students have final_approved registrations
    const approvedRegistrations = await Registration.find({
      studentId: { $in: studentIds },
      overallStatus: 'final_approved'
    }).distinct('studentId');

    if (approvedRegistrations.length === 0) {
      return { 
        success: true, 
        promoted: 0, 
        message: 'No students with final_approved registration status found' 
      };
    }

    // Perform bulk update using bulkWrite for efficiency
    const bulkOps = approvedRegistrations.map(studentId => ({
      updateOne: {
        filter: { _id: studentId },
        update: {
          $inc: { currentSemester: 1, semester: 1 }, // Increment both for compatibility
          $set: { 
            lastPromotedAt: currentDate,
            overallStatus: 'active' // Reset status for new semester
          }
        }
      }
    }));

    const result = await Student.bulkWrite(bulkOps);

    return {
      success: true,
      promoted: result.modifiedCount,
      message: `Successfully promoted ${result.modifiedCount} student(s) to next semester`,
      details: {
        eligible: eligibleStudents.length,
        withApprovedRegistration: approvedRegistrations.length,
        actuallyPromoted: result.modifiedCount
      }
    };
  } catch (error) {
    console.error('Promotion error:', error);
    throw new Error(`Promotion failed: ${error.message}`);
  }
};

/**
 * Get promotion statistics
 */
export const getPromotionStats = async () => {
  try {
    const stats = await Student.aggregate([
      {
        $group: {
          _id: {
            program: '$program',
            semester: '$currentSemester'
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.program': 1, '_id.semester': 1 }
      }
    ]);

    // Get students eligible for promotion
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const eligibleCount = await Student.countDocuments({
      currentSemester: { $lt: 8 },
      $or: [
        { lastPromotedAt: { $exists: false } },
        { lastPromotedAt: { $lt: oneMonthAgo } }
      ]
    });

    // Get students with approved registrations
    const approvedRegistrations = await Registration.countDocuments({
      overallStatus: 'final_approved'
    });

    return {
      distributionByProgramAndSemester: stats,
      eligibleForPromotion: eligibleCount,
      withApprovedRegistration: approvedRegistrations
    };
  } catch (error) {
    throw new Error(`Failed to get promotion stats: ${error.message}`);
  }
};
