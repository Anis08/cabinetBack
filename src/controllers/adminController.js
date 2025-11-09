import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from "../prisma.js";



prisma.$use(async (params, next) => {
  if (params.model === "Resume" && params.action === "create") {
    const result = await next(params);

    const chapitre = await prisma.chapitre.findUnique({
      where: { id: result.chapitreId },
      select: { moduleId: true }
    });


    

    if (chapitre) {
        const moduleId = chapitre.moduleId;

        const existingResume = await prisma.resume.findFirst({
        where: {
          chapitre: { moduleId },  // any chapitre belonging to the same module
          contributorId: result.contributorId
        }
      });

      await prisma.module.update({
        where: { id: chapitre.moduleId },
        data: { updatedAt: new Date(),
                resumesCount: { increment: 1 },
                ...(existingResume ? {} : { contributorsCount: { increment: 1 } })
         }
      });
    }
    

    return result;
  }

  return next(params);
});

function formatDateMMDDYYYY(date) {
    const r = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
  return r
}


export const seeResume = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const record = await prisma.resumeRequest.findUnique({
            where: { id },
            include: { contributor: true, chapitre: true },
        });

        if (!record) return res.status(404).json({ error: 'Not found' });

        res.json({
            id: record.id,
            fileName: record.fileName,
            fileType: record.fileType,
            title: record.title,
            description: record.description,
            contributorName: record.contributor.prenom, 
            uploadDate: formatDateMMDDYYYY(record.uploadDate),
            wilaya: record.wilaya,
        });
    }
    catch (err) {
        console.error(err)
    }


}


export const seeResumeFile =  async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const record = await prisma.resumeRequest.findUnique({ where: { id } });

        if (!record) return res.status(404).send('File not found');

        res.setHeader('Content-Type', record.fileType);
        res.setHeader('Content-Disposition', `inline; filename="${record.fileName}"`);
        res.send(Buffer.from(record.fileContent));
    }
    catch (err) {
        console.error(err)
    }

};

export const acceptResumeRequest = async (req, res) => {
  const { id, link } = req.body;
  try {
    const record = await prisma.resumeRequest.findUnique({ where: { id } });

    if (!record) return res.status(404).json({ error: 'Not found' });

    const resume = await prisma.resume.create({

      data: {
        chapitreId: record.chapitreId,
        title: record.title,
        description: record.description,
        contributorId: record.contributorId,
        wilaya: record.wilaya,
        link,
        rating: 0
      }

    });

    await prisma.resumeRequest.delete({ where: { id } });

    res.status(200).json({ resume });
  } catch (err) {
    res.status(500).json({ message: 'Failed to retrieve modules', error: err.message });
    console.error(err);
  }
}