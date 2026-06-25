import logger from '../utils/logger.js';

const requireAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Authentication required.' });
    }

    if (req.user.role !== 'admin') {
        logger.logError(`Unauthorized admin access attempt by user ${req.user._id}`);
        return res.status(403).json({ message: 'Admin access required.' });
    }

    next();
};

export default requireAdmin;
