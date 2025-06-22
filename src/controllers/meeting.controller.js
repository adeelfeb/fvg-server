import { PrismaClient } from '@prisma/client';
import axios from 'axios';
const prisma = new PrismaClient();

export const createMeeting = async (req, res) => {
  try {
    const { clientContractorId, title, description, startTime, endTime, calendlyEventId } = req.body;
    const userId = req.user.id;

    // Verify user has access to this client-contractor relationship
    const relationship = await prisma.clientContractor.findUnique({
      where: { id: clientContractorId },
      select: { clientId: true, contractorId: true }
    });

    if (![relationship.clientId, relationship.contractorId].includes(userId)) {
      return res.status(403).json({ error: 'Not authorized to create meeting for this relationship' });
    }

    const meeting = await prisma.meeting.create({
      data: {
        clientContractorId,
        title,
        description,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        meetingUrl: `https://calendly.com/events/${calendlyEventId}`,
        calendlyEventId
      }
    });

    res.status(201).json(meeting);
  } catch (error) {
    console.error('Create meeting error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getClientMeetings = async (req, res) => {
  try {
    const meetings = await prisma.meeting.findMany({
      where: {
        clientContractor: { clientId: req.user.id }
      },
      include: {
        clientContractor: {
          include: {
            contractor: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                profile: true
              }
            }
          }
        }
      },
      orderBy: { startTime: 'asc' }
    });

    res.json(meetings);
  } catch (error) {
    console.error('Get client meetings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getContractorMeetings = async (req, res) => {
  try {
    const meetings = await prisma.meeting.findMany({
      where: {
        clientContractor: { contractorId: req.user.id }
      },
      include: {
        clientContractor: {
          include: {
            client: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          }
        }
      },
      orderBy: { startTime: 'asc' }
    });

    res.json(meetings);
  } catch (error) {
    console.error('Get contractor meetings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};