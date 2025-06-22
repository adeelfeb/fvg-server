import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const profile = await prisma.profile.findUnique({
      where: { userId },
      include: { user: true }
    });

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json(profile);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const profileData = req.body;

    if (req.files) {
      if (req.files.resume) profileData.resumeUrl = req.files.resume[0].path;
      if (req.files.profilePhoto) profileData.profilePhotoUrl = req.files.profilePhoto[0].path;
      if (req.files.speedTest) profileData.internetSpeedScreenshotUrl = req.files.speedTest[0].path;
      if (req.files.video) profileData.videoIntroductionUrl = req.files.video[0].path;
    }

    if (profileData.skills) profileData.skills = Array.isArray(profileData.skills) ? profileData.skills : [profileData.skills];
    if (profileData.remoteTools) profileData.remoteTools = Array.isArray(profileData.remoteTools) ? profileData.remoteTools : [profileData.remoteTools];
    if (profileData.spokenLanguages) profileData.spokenLanguages = Array.isArray(profileData.spokenLanguages) ? profileData.spokenLanguages : [profileData.spokenLanguages];

    const updatedProfile = await prisma.profile.update({
      where: { userId },
      data: profileData
    });

    res.json(updatedProfile);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getContractors = async (req, res) => {
  try {
    const { roleType, skills, minRate, maxRate, availability } = req.query;

    const filters = {
      user: { role: 'CONTRACTOR', isActive: true }
    };

    if (roleType) filters.roleType = roleType;
    if (skills) filters.skills = { hasSome: Array.isArray(skills) ? skills : [skills] };
    if (minRate || maxRate) {
      filters.OR = [
        {
          customRate: {
            gte: minRate ? parseFloat(minRate) : undefined,
            lte: maxRate ? parseFloat(maxRate) : undefined
          }
        },
        {
          rateRange: {
            in: getRateRanges(minRate, maxRate)
          }
        }
      ];
    }
    if (availability) filters.availability = availability;

    const contractors = await prisma.profile.findMany({
      where: filters,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    res.json(contractors);
  } catch (error) {
    console.error('Get contractors error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Helper function for rate range filtering
function getRateRanges(minRate, maxRate) {
  const ranges = [];
  // Add your logic here
  return ranges;
}
