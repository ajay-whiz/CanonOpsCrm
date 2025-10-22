import { Router } from 'express';
import { SomeController } from '../controllers';

const router = Router();

router.get('/some-route', SomeController.someMethod);
router.post('/another-route', SomeController.anotherMethod);

export default router;