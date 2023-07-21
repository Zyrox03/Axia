const isAdmin = (req, res, next) => {
    const { user } = req;
    if (user && user.admin) {
        next();
    } else {
        return res.status(403).json({ message: 'Forbidden - Not authorized as an admin' });
    }
};
const isProfileOwner = (req, res, next) => {
    const { user } = req;
    const { firebaseID } = req.params;
    if (user.uid !== firebaseID) {
      return res.status(403).json({ message: 'Forbidden - You can only update your own profile.' });
    }
    next();
  };
  
  // Usage in routes
  



module.exports = { isAdmin, isProfileOwner };
