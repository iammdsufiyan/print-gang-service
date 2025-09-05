import { describe, it, expect } from 'vitest';
import { cartTransformRun } from './cart_transform_run';
import { CartTransformRunInput, CartTransformRunResult } from '../generated/api';

// A mock input object that matches the CartTransformRunInput type
const mockInput: CartTransformRunInput = {
  cart: {
    lines: [],
    // Add other required fields from the Cart type if necessary,
    // but for this function, only lines are accessed.
    // The type generation from the GraphQL query will determine what's required.
    // Based on the provided api.ts, the query only asks for cart.lines.
    // Let's assume the minimal structure is sufficient for the function to run.
  }
};

describe('cart transform function', () => {
  it('returns no operations when cart has no lines', () => {
    const result = cartTransformRun(mockInput);
    const expected: CartTransformRunResult = { operations: [] };
    expect(result).toEqual(expected);
  });

  it('returns no operations if no line has a custom_price attribute', () => {
    const inputWithLines: CartTransformRunInput = {
      cart: {
        lines: [
          {
            id: "gid://shopify/CartLine/1",
            quantity: 1,
            attribute: { key: "some_other_attribute", value: "10.00" }
          }
        ]
      }
    };
    const result = cartTransformRun(inputWithLines);
    const expected: CartTransformRunResult = { operations: [] };
    expect(result).toEqual(expected);
  });

  it('returns an update operation if a line has a valid custom_price attribute', () => {
    const inputWithCustomPrice: CartTransformRunInput = {
      cart: {
        lines: [
          {
            id: "gid://shopify/CartLine/2",
            quantity: 2,
            attribute: { key: "custom_price", value: "100.00" }
          }
        ]
      }
    };
    const result = cartTransformRun(inputWithCustomPrice);
    expect(result.operations).toHaveLength(1);
    expect(result.operations[0]).toEqual({
      update: {
        cartLineId: "gid://shopify/CartLine/2",
        price: {
          adjustment: {
            fixedPricePerUnit: {
              amount: "50.00"
            }
          }
        }
      }
    });
  });

  it('returns no operations for a line with an invalid custom_price value', () => {
    const inputWithInvalidPrice: CartTransformRunInput = {
      cart: {
        lines: [
          {
            id: "gid://shopify/CartLine/3",
            quantity: 1,
            attribute: { key: "custom_price", value: "invalid" }
          }
        ]
      }
    };
    const result = cartTransformRun(inputWithInvalidPrice);
    expect(result.operations).toHaveLength(0);
  });
});