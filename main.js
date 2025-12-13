import { render, screen } from "@testing-library/react"; // Import render and screen from testing library

describe("Greet", () => {
  // Test case to check if "Hello" text is rendered in the App component
  test("renders default greeting", () => {
    render(<App />); // Render the App component
    const textContent = screen.getByText("Hello"); // Find element with text "Hello"
    expect(textContent).toBeInTheDocument(); // Assert that the text element is in the document
  });

  // Test case to check if "Hello sujan" text is rendered when name prop is passed
  test("renders greeting with name prop", () => {
    render(<App name="sujan" />); // Render the App component with name="sujan" prop
    const propsContext = screen.getByText("Hello sujan"); // Find element with text "Hello sujan"
    expect(propsContext).toBeInTheDocument(); // Assert that the text element is in the document
  });
});