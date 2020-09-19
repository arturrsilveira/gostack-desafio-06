/* eslint-disable no-param-reassign */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { EntityRepository, Repository, TableInheritance } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<Balance> {
    const transactions = await this.find();
    const { income, outcome } = transactions.reduce(
      (incrementValue, transaction) => {
        switch (transaction.type) {
          case 'income':
            incrementValue.income += Number(transaction.value);
            break;
          case 'outcome':
            incrementValue.outcome += Number(transaction.value);
            break;
          default:
            break;
        }
        return incrementValue;
      },
      {
        income: 0,
        outcome: 0,
        total: 0,
      },
    );
    const total = income - outcome;
    return { income, outcome, total };
  }
}

export default TransactionsRepository;
