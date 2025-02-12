import { enableSharingQuestion, restore } from "__support__/e2e/cypress";
import { SAMPLE_DATASET } from "__support__/e2e/cypress_sample_dataset";

const { PEOPLE } = SAMPLE_DATASET;

const questionData = {
  name: "15460",
  native: {
    query: "SELECT * FROM PEOPLE WHERE {{birthdate}} AND {{source}}",
    "template-tags": {
      birthdate: {
        id: "08c5ea9d-1579-3503-37f1-cbe4d29e6a28",
        name: "birthdate",
        "display-name": "Birthdate",
        type: "dimension",
        dimension: ["field", PEOPLE.BIRTH_DATE, null],
        "widget-type": "date/all-options",
        default: "past30years",
      },
      source: {
        id: "37eb6fa2-3677-91d3-6be0-c5dd9113c672",
        name: "source",
        "display-name": "Source",
        type: "dimension",
        dimension: ["field", PEOPLE.SOURCE, null],
        "widget-type": "string/=",
        default: "Affiliate",
      },
    },
  },
};

const EXPECTED_QUERY_PARAMS = "?birthdate=past30years&source=Affiliate";

describe("scenarios > question > public", () => {
  beforeEach(() => {
    restore();
    cy.signInAsAdmin();

    cy.request("PUT", "/api/setting/enable-public-sharing", { value: true });
  });

  it("adds filters to url as get params (metabase#7120)", () => {
    cy.createNativeQuestion(questionData).then(({ body: { id } }) => {
      enableSharingQuestion(id);
      cy.visit(`/question/${id}`);
    });

    cy.icon("share").click();

    visitPublicURL();

    // On page load, query params are added
    cy.url().should("include", "/public/question");
    cy.url().should("include", EXPECTED_QUERY_PARAMS);
  });
});

const visitPublicURL = () => {
  // Ideally we would just find the first input
  // but unless we filter by value
  // Cypress finds an input before the copyable inputs are rendered
  cy.findByDisplayValue(/^http/)
    .invoke("val")
    .then(publicURL => {
      // Copied URL has no get params
      expect(publicURL).not.to.have.string(EXPECTED_QUERY_PARAMS);

      cy.visit(publicURL);
    });
};
