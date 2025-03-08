# JSON Editor

This project is a Universal JSON Editor built with React and TypeScript. It allows users to input JSON data, view its structure, generate a schema, and modify the JSON by removing selected fields.

## Features

- Parse and validate JSON input.
- Generate a JSON schema from the input data.
- Display the JSON data in a collapsible tree format.
- Count the occurrences of items in the JSON structure.
- Remove selected fields from the JSON data.

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm (Node Package Manager)

### Installation

1. Clone the repository:

   ```
   git clone <repository-url>
   ```

2. Navigate to the project directory:

   ```
   cd JsonEditor
   ```

3. Install the dependencies:

   ```
   npm install
   ```

### Usage

1. Start the development server:

   ```
   npm start
   ```

2. Open your browser and go to `http://localhost:3000` to access the JSON Editor.

### How to Use

- Paste your JSON data into the input area.
- Click the "Continue" button to parse the JSON.
- Use the checkboxes to toggle the display of the JSON schema, item counts, and parsed JSON tree.
- Select fields you want to remove and click the "Remove Fields" button to modify the JSON.
- You can copy the generated schema or modified JSON to your clipboard using the provided buttons.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.

## License

This project is licensed under the MIT License. See the LICENSE file for details.