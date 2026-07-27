import 'multer';

declare global {
  namespace Express {
    // Re-export Multer namespace so @types/multer augmentation merges correctly
    namespace Multer {}
  }
}
