import {
  DiscountClass,
  ProductDiscountSelectionStrategy,
  CartInput,
  CartLinesDiscountsGenerateRunResult,
} from '../generated/api';

export function cartLinesDiscountsGenerateRun(
  input: CartInput,
): CartLinesDiscountsGenerateRunResult {
  const operations = input.cart.lines.reduce((acc, line) => {
    const customPriceAttribute = (line as any).attribute;

    if (!customPriceAttribute) {
      return acc;
    }

    const value = customPriceAttribute.value;
    if (!value) {
      return acc;
    }

    const perUnitPrice = parseFloat(value);
    if (Number.isNaN(perUnitPrice) || perUnitPrice < 0) {
      return acc;
    }

    const quantity = (line as any).quantity ?? 1;
    const currentTotal = parseFloat(line.cost.subtotalAmount.amount);
    const desiredTotal = perUnitPrice * quantity;
    const discountAmount = currentTotal - desiredTotal;

    if (discountAmount > 0) {
      acc.push({
        productDiscountsAdd: {
          discountClass: DiscountClass.Product,
          candidates: [
            {
              targets: [{ cartLine: { id: line.id } }],
              value: {
                fixedAmount: {
                  amount: discountAmount.toFixed(2),
                },
              },
            },
          ],
          selectionStrategy: ProductDiscountSelectionStrategy.First,
        },
      });
    }

    return acc;
  }, [] as any[]);

  return {
    operations,
  };
}