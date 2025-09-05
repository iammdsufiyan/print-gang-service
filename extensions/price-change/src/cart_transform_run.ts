import {
  CartTransformRunInput,
  CartTransformRunResult,
  CartOperation,
  Operation,
} from "../generated/api";

export function cartTransformRun(input: CartTransformRunInput): CartTransformRunResult { 
  const operations: CartOperation[] = [];

  for (const line of input.cart.lines) {
    const attributes = (line as any).attributes || (line.attribute ? [line.attribute] : []);
    const customPriceAttr = attributes.find((attr: { key: string; }) => attr.key === "custom_price");

    if (customPriceAttr && customPriceAttr.value) {
      const customPrice = parseFloat(customPriceAttr.value);
      const quantity = line.quantity > 0 ? line.quantity : 1;
      const pricePerUnit = customPrice / quantity;
      
      if (!isNaN(pricePerUnit) && pricePerUnit >= 0) {
        operations.push({
          update: {
            cartLineId: line.id,
            price: {
              adjustment: {
                fixedPricePerUnit: {
                  amount: pricePerUnit.toFixed(2)
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