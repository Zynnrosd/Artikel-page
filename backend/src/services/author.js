import { prisma } from '../utils/db.js';
import { HttpError } from '../utils/error.js';

const authorService = {
  // Get all authors
  async getAllAuthors() {
    const authors = await prisma.users.findMany({
      where: {
        role: 'author', // Pastikan hanya mendapatkan pengguna dengan role 'author'
      },
    });
    return authors;
  },

  // Create a new author
  async createAuthor(name) {
    const existingAuthor = await prisma.users.findUnique({
      where: {
        name: name,
      },
    });

    if (existingAuthor) {
      throw new HttpError('Author already exists', 400);
    }

    const newAuthor = await prisma.users.create({
      data: {
        name,
        role: 'author', // Pastikan memberikan role 'author'
      },
    });
    return newAuthor;
  },

  // Update an existing author
  async updateAuthor(id, name) {
    const author = await prisma.users.findUnique({
      where: {
        id,
      },
    });

    if (!author) {
      throw new HttpError('Author not found', 404);
    }

    const updatedAuthor = await prisma.users.update({
      where: {
        id,
      },
      data: {
        name,
      },
    });
    return updatedAuthor;
  },

  // Delete an author
  async deleteAuthor(id) {
    const author = await prisma.users.findUnique({
      where: {
        id,
      },
    });

    if (!author) {
      throw new HttpError('Author not found', 404);
    }

    await prisma.users.delete({
      where: {
        id,
      },
    });
  },
};

export default authorService;
