export const GraphQLUpload = jest.fn();

export const graphqlUploadExpress = jest.fn(() => (req: any, res: any, next: () => void) => next());

export const processRequest = jest.fn();