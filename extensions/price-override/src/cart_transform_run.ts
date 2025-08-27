import { CartLinesDiscountsGenerateRunResult, CartOperation } from "../generated/api";

export function cartTransformRun(input: any): CartLinesDiscountsGenerateRunResult {
  const operations: CartOperation[] = input.cart.lines.flatMap((line: any) => {
    const customPriceProperty = line.attributes.find(
      (prop: any) => prop.key === "Custom_Price"
    );

    if (customPriceProperty && customPriceProperty.value) {
      const price = parseFloat(customPriceProperty.value);
      if (!isNaN(price)) {
        return [{
          productDiscountsAdd: {
            candidates: [
              {
                targets: [{ cartLine: { id: line.id } }],
                value: {
                  fixedAmount: {
                    amount: price,
                  },
                },
              },
            ],
            selectionStrategy: "FIRST",
          },
        }];
      }
    }

    return [];
  });

  return { operations };
}