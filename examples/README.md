# Examples

- `corner-shop.scene.json`: a small online shop mapped onto the `ecommerce-shop` theme. It has the five MVP zones plus a notifications zone that uses the common-kit postal route.
- `corner-shop.issues.json`: fake tracker state for that scene, in the shape a connector reports (`IssueState`). It gives a mix of statuses: auth is done; catalogue, cart and notifications are in progress; checkout and inventory are planned.

Both files are checked by the `@diorama/schema` tests.
