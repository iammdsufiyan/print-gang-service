import {
  Input,
  FunctionResult,
  CartOperation,
} from "../generated/api";

export function run(input: Input): FunctionResult {
  const operations: CartOperation[] = [];

  for (const line of input.cart.lines) {
    // The attribute property on the cart line is not an array, so we access it directly.
    const customPriceAttr = line.attribute;

    // Check if the attribute exists, has the key "custom_price", and has a value.
    if (customPriceAttr && customPriceAttr.key === "custom_price" && customPriceAttr.value) {
      const customPrice = parseFloat(customPriceAttr.value);
      
      // Ensure the parsed price is a valid number and not negative.
      if (!isNaN(customPrice) && customPrice >= 0) {
        // Create an update operation to set the fixed price for the cart line.
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

  return { operations };
}