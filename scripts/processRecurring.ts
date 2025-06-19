import dbConnect, { db } from '../src/lib/mongodb';
import User from '../src/models/User';
import { sendTransactionEmail } from '../src/lib/mail';


async function processRecurringTransactions() {
  await dbConnect();
  const users = await User.find({ recurring: { $exists: true, $ne: [] } });

  const today = new Date();

  for (const user of users) {
    for (const rule of user.recurring) {
      const lastRun = rule.lastRun ? new Date(rule.lastRun) : null;
      const shouldRun =
        rule.interval === 'daily' ||
        (rule.interval === 'weekly' && (!lastRun || today.getTime() - lastRun.getTime() > 7 * 86400000)) ||
        (rule.interval === 'monthly' && (!lastRun || today.getTime() - lastRun.getTime() > 30 * 86400000));

      if (shouldRun) {
        const { transaction } = await db.createTransaction(
          user._id.toString(),
          {
            type: rule.type,
            amount: rule.amount,
            description: rule.description,
            currency: 'USD',
          },
          'completed'
        );

        rule.lastRun = today;
        await sendTransactionEmail(user.email, {
          name: user.name,
          transaction,
        });
      }
    }
    await user.save();
  }

  console.log('✅ Recurring transactions processed.');
}

processRecurringTransactions().catch(console.error);
