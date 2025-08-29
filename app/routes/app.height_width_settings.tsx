import { json, ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { useActionData, useLoaderData, useNavigation, useSubmit } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  Form,
  FormLayout,
  TextField,
  Checkbox,
  Button,
  BlockStack,
  Toast,
  Frame,
  Select,
  Icon,
  InlineStack,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { useState, useCallback, useEffect } from "react";
import { DeleteIcon } from "@shopify/polaris-icons";

const METAFIELD_NAMESPACE = "custom";
const METAFIELD_KEY = "height_width_settings";

async function getShopId(admin: any) {
  const response = await admin.graphql(
    `#graphql
      query getShopId {
        shop {
          id
        }
      }`
  );
  const data = await response.json();
  return data.data.shop.id;
}

async function getSettings(admin: any) {
  const response = await admin.graphql(
    `#graphql
      query getSettings($namespace: String!, $key: String!) {
        shop {
          metafield(namespace: $namespace, key: $key) {
            value
          }
        }
      }`,
    {
      variables: {
        namespace: METAFIELD_NAMESPACE,
        key: METAFIELD_KEY,
      },
    },
  );

  const data = await response.json();
  if (data.data.shop.metafield) {
    return JSON.parse(data.data.shop.metafield.value);
  }

  return {
    defaultWidth: "24",
    lockWidth: false,
    imageUrl: "",
    priceRules: [{ height: "", unit: "in", price: "" }],
  };
}

async function saveSettings(admin: any, shopId: string, settings: any) {
  const response = await admin.graphql(
    `#graphql
      mutation saveSettings($metafields: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafields) {
          metafields {
            id
            key
            namespace
            value
          }
          userErrors {
            field
            message
          }
        }
      }`,
    {
      variables: {
        metafields: [
          {
            namespace: METAFIELD_NAMESPACE,
            key: METAFIELD_KEY,
            type: "json",
            value: JSON.stringify(settings),
            ownerId: shopId,
          },
        ],
      },
    },
  );

  const data = await response.json();
  if (data.data.metafieldsSet.userErrors.length > 0) {
    console.error("Error saving metafields:", data.data.metafieldsSet.userErrors);
    return { success: false, errors: data.data.metafieldsSet.userErrors };
  }
  return { success: true, settings };
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const settings = await getSettings(admin);
  return json(settings);
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const shopId = await getShopId(admin);

  const priceRules = JSON.parse(formData.get("priceRules") as string);

  const settings = {
    defaultWidth: formData.get("defaultWidth"),
    lockWidth: formData.get("lockWidth") === "on",
    imageUrl: formData.get("imageUrl"),
    priceRules: priceRules,
  };

  const result = await saveSettings(admin, shopId, settings);

  return json(result);
};

export default function HeightWidthSettingsPage() {
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const submit = useSubmit();

  const [width, setWidth] = useState(loaderData.defaultWidth);
  const [lockWidth, setLockWidth] = useState(loaderData.lockWidth);
  const [imageUrl, setImageUrl] = useState(loaderData.imageUrl);
  const [priceRules, setPriceRules] = useState(
    loaderData.priceRules || [{ height: "", unit: "in", price: "" }],
  );

  const [toastActive, setToastActive] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastIsError, setToastIsError] = useState(false);

  const isSaving = navigation.state === "submitting";

  useEffect(() => {
    if (actionData) {
      if ("settings" in actionData && actionData.settings) {
        setToastMessage("Settings saved successfully!");
        setToastIsError(false);
        // @ts-ignore
        setWidth(actionData.settings.defaultWidth);
        // @ts-ignore
        setLockWidth(actionData.settings.lockWidth);
        // @ts-ignore
        setImageUrl(actionData.settings.imageUrl);
        // @ts-ignore
        setPriceRules(actionData.settings.priceRules);
      } else if ("errors" in actionData) {
        setToastMessage("Error saving settings.");
        setToastIsError(true);
      }
      setToastActive(true);
    }
  }, [actionData]);

  const toggleToastActive = useCallback(() => setToastActive((active) => !active), []);

  const handleLockWidthChange = useCallback(
    (checked: boolean) => setLockWidth(checked),
    [],
  );


  const handlePriceRuleChange = (index: number, field: string, value: string) => {
    const newPriceRules = [...priceRules];
    newPriceRules[index][field] = value;
    setPriceRules(newPriceRules);
  };

  const addPriceRule = () => {
    setPriceRules([...priceRules, { height: "", unit: "in", price: "" }]);
  };

  const removePriceRule = (index: number) => {
    const newPriceRules = priceRules.filter((_: any, i: number) => i !== index);
    setPriceRules(newPriceRules);
  };

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.set("priceRules", JSON.stringify(priceRules));
    submit(formData, { method: "post" });
  }

  const toastMarkup = toastActive ? (
    <Toast content={toastMessage} onDismiss={toggleToastActive} error={toastIsError} />
  ) : null;

  return (
    <Frame>
      <Page>
        <ui-title-bar title="Height and Width Picker Settings" />
        <Layout>
          <Layout.Section>
            <Card>
              <Form onSubmit={handleSubmit}>
                <FormLayout>
                  <BlockStack gap="400">
                    <Select
                      label="Default Width (inches)"
                      name="defaultWidth"
                      options={[
                        { label: "22", value: "22" },
                        { label: "24", value: "24" },
                        { label: "30", value: "30" },
                        { label: "36", value: "36" },
                        { label: "42", value: "42" },
                        { label: "44", value: "44" },
                        { label: "54", value: "54" },
                        { label: "60", value: "60" },
                      ]}
                      value={width}
                      onChange={setWidth}
                    />
                    <Checkbox
                      label="Lock Width"
                      name="lockWidth"
                      checked={lockWidth}
                      onChange={handleLockWidthChange}
                    />
                    <TextField
                      label="Image URL"
                      name="imageUrl"
                      value={imageUrl}
                      onChange={setImageUrl}
                      placeholder="https://example.com/image.png"
                      autoComplete="off"
                    />

                    <BlockStack gap="400">
                      {priceRules.map((rule: any, index: number) => (
                        <InlineStack key={index} gap="400" blockAlign="center">
                          <div style={{ flex: 1 }}>
                            <TextField
                              label={`Rule ${index + 1} Height`}
                              type="number"
                              value={rule.height}
                              onChange={(value) =>
                                handlePriceRuleChange(index, "height", value)
                              }
                              autoComplete="off"
                            />
                          </div>
                          <div style={{ flex: 1 }}>
                            <Select
                              label="Unit"
                              options={[
                                { label: "in", value: "in" },
                                { label: "ft", value: "ft" },
                              ]}
                              value={rule.unit}
                              onChange={(value) =>
                                handlePriceRuleChange(index, "unit", value)
                              }
                            />
                          </div>
                          <div style={{ flex: 1 }}>
                            <TextField
                              label="Price"
                              type="number"
                              prefix="$"
                              value={rule.price}
                              onChange={(value) =>
                                handlePriceRuleChange(index, "price", value)
                              }
                              autoComplete="off"
                              min={0}
                              step={0.01}
                            />
                          </div>
                          <Button
                            onClick={() => removePriceRule(index)}
                            accessibilityLabel="Remove rule"
                            variant="tertiary"
                            icon={DeleteIcon}
                          />
                        </InlineStack>
                      ))}
                      <Button onClick={addPriceRule}>Add Price Rule</Button>
                    </BlockStack>

                    <Button submit loading={isSaving} variant="primary">
                      Save Settings
                    </Button>
                  </BlockStack>
                </FormLayout>
              </Form>
            </Card>
          </Layout.Section>
        </Layout>
        {toastMarkup}
      </Page>
    </Frame>
  );
}