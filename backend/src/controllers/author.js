import { asyncWrapper } from '../utils/asyncWrapper.js';
import { HttpError } from '../utils/error.js';
import authorService from '../services/author.js'; 
const authorController = {
  // Get all authors
  getAllAuthors: asyncWrapper(async (req, res) => {
    const authors = await authorService.getAllAuthors();
    res.status(200).json({
      success: true,
      message: 'Authors retrieved successfully',
      data: authors,
    });
  }),

  // Create a new author
  createAuthor: asyncWrapper(async (req, res) => {
    const { name } = req.body;
    if (!name || name.trim() === '') {
      throw new HttpError('Author name is required', 400);
    }

    const author = await authorService.createAuthor(name);
    res.status(201).json({
      success: true,
      message: 'Author created successfully',
      data: author,
    });
  }),

  // Update an existing author
  updateAuthor: asyncWrapper(async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;

    if (!name || name.trim() === '') {
      throw new HttpError('Author name is required', 400);
    }

    const updatedAuthor = await authorService.updateAuthor(id, name);
    res.status(200).json({
      success: true,
      message: 'Author updated successfully',
      data: updatedAuthor,
    });
  }),

  // Delete an author
  deleteAuthor: asyncWrapper(async (req, res) => {
    const { id } = req.params;

    await authorService.deleteAuthor(id);
    res.status(200).json({
      success: true,
      message: 'Author deleted successfully',
    });
  }),
};

export default authorController;
