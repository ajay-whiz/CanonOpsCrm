import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';

const rbac = (roles: string[]) => {
  return async (req: NextApiRequest, res: NextApiResponse, next: () => void) => {
    const session = await getSession({ req });

    if (!session || !session.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const userRole = session.user.role;

    if (!roles.includes(userRole)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    next();
  };
};

export default rbac;