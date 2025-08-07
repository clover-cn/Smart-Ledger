import { Router } from 'express';
import { TransactionController } from '../controllers/transactionController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
const transactionController = new TransactionController();

// 所有路由都需要认证
router.use(authenticateToken);

// 交易记录CRUD路由
router.post('/', transactionController.create);
router.get('/', transactionController.getList);
router.get('/dashboard', transactionController.getDashboard);
router.get('/:id', transactionController.getById);
router.put('/:id', transactionController.update);
router.delete('/:id', transactionController.delete);

// 批量操作路由
router.post('/batch', transactionController.batchCreate);

export default router;