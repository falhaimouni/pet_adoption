import type { Product } from '../../database/entities/product.entity';
import type { Supply } from '../../database/entities/supply.entity';
import { SupplyStatusEnum } from '@shared/enums/supply-status.enum';

// Cart display and checkout must agree on which inventory-backed items are visible.
export function listedStoreSupplyForProduct(product?: Product | null): Supply | undefined {
  return product?.supplies?.find((supply) =>
    supply.isActive === true &&
    supply.storeListed === true &&
    supply.status === SupplyStatusEnum.AVAILABLE &&
    Number(supply.quantity ?? 0) > 0,
  );
}
