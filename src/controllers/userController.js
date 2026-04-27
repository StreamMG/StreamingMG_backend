const User = require('../models/User.model');
const WatchHistory = require('../models/WatchHistory.model');
const Purchase = require('../models/Purchase.model');
const TutorialProgress = require('../models/TutorialProgress.model');
const bcrypt = require('bcryptjs');

// ─────────────────────────────────────────────────────────────
//  GET /api/user/profile
// ─────────────────────────────────────────────────────────────
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur introuvable' });
    }

    // Calculer les statistiques
    const [totalWatched, totalPurchases, tutorialsInProgress] = await Promise.all([
      WatchHistory.countDocuments({ userId: req.user.id }),
      Purchase.countDocuments({ userId: req.user.id }),
      TutorialProgress.countDocuments({ userId: req.user.id, percentComplete: { $lt: 100 } })
    ]);

    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      isPremium: user.isPremium,
      premiumExpiry: user.premiumExpiry,
      createdAt: user.createdAt,
      stats: {
        totalWatched,
        totalPurchases,
        tutorialsInProgress
      }
    });

  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
//  PATCH /api/user/profile
// ─────────────────────────────────────────────────────────────
exports.updateProfile = async (req, res, next) => {
  try {
    const { username } = req.body;
    
    // Validation stricte selon documentation
    if (!username || username.trim().length < 3 || username.trim().length > 30) {
      return res.status(400).json({ message: "Nom d'utilisateur invalide", code: 'INVALID_USERNAME' });
    }

    const dup = await User.findOne({ username, _id: { $ne: req.user.id } });
    if (dup) {
      return res.status(409).json({ message: "Nom d'utilisateur déjà pris", code: 'USERNAME_DUPLICATE' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { username },
      { new: true, runValidators: true }
    ).select('-passwordHash');

    if (!updatedUser) {
      return res.status(404).json({ message: 'Utilisateur introuvable' });
    }

    res.json({
      _id: updatedUser._id,
      username: updatedUser.username,
      email: updatedUser.email
    });

  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
//  PATCH /api/user/password
// ─────────────────────────────────────────────────────────────
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validation stricte documentation
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ message: 'Nouveau mot de passe trop faible', code: 'WEAK_PASSWORD' });
    }

    // Récupérer l'utilisateur avec son hash
    const user = await User.findById(req.user.id).select('+passwordHash');
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur introuvable' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Mot de passe actuel incorrect', code: 'WRONG_PASSWORD' });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await user.save();

    res.json({ message: 'Mot de passe mis à jour avec succès' });

  } catch (err) {
    next(err);
  }
};
