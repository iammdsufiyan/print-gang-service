import {
  CartTransformRunInput,
  CartTransformRunResult,
  CartOperation,
  Operation,
} from "../generated/api";

export function cartTransformRun(input: CartTransformRunInput): CartTransformRunResult {
  const operations: CartOperation[] = [];

  for (const line of input.cart.lines) {
    const customPriceAttr = line.attribute;

    if (customPriceAttr && customPriceAttr.key === "custom_price" && customPriceAttr.value) {
      const customPrice = parseFloat(customPriceAttr.value);
      
      if (!isNaN(customPrice) && customPrice >= 0) {
        operations.push({
          update: {
            cartLineId: line.id,
            price: {
              adjustment: {
                fixedPricePerUnit: {
                  amount: customPrice.toString()
                }
              }
            }
          }
        });
      }
    }
  }

  return { operations: operations as unknown as Operation[] };
}