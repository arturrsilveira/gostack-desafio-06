import { getRepository, getCustomRepository, In } from 'typeorm';
import csvParse from 'csv-parse';
import fs from 'fs';

import Transaction from '../models/Transaction';
import Category from '../models/Category';

import TransectiosRepository from '../repositories/TransactionsRepository';

interface CSVTransacation {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class ImportTransactionsService {
  async execute(filePath: string): Promise<Transaction[]> {
    const transactionRepository = getCustomRepository(TransectiosRepository);
    const categoriesRepository = getRepository(Category);

    const contactsReadStream = fs.createReadStream(filePath);
    const parsers = csvParse({
      from_line: 2,
    });

    const parseCSV = contactsReadStream.pipe(parsers);

    const transactions: CSVTransacation[] = [];
    const categories: string[] = [];

    parseCSV.on('data', async line => {
      const [title, type, value, category] = line.map((cell: string) =>
        cell.trim(),
      );
      // eslint-disable-next-line no-useless-return
      if (!title || !type || !value) return;

      categories.push(category);
      transactions.push({ title, type, value, category });
    });
    await new Promise(resolve => parseCSV.on('end', resolve));

    const existentCategories = await categoriesRepository.find({
      where: {
        title: In(categories),
      },
    });

    const existentCategoriesTitle = existentCategories
      .map((category: Category) => category.title)
      .filter((value, index, self) => self.indexOf(value) === index);

    const addCategoryTitles = categories.filter(
      category => !existentCategoriesTitle.includes(category),
    );

    const newCategories = categoriesRepository.create(
      addCategoryTitles.map(title => ({
        title,
      })),
    );
    await categoriesRepository.save(newCategories);
  }
}

export default ImportTransactionsService;
