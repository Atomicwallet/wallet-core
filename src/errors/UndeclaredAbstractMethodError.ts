class UndeclaredAbstractMethodError extends Error {
  constructor(method: string, instance: unknown) {
    super(
      `You should declare the '${method}' abstract method in the ${instance?.constructor.name} class!`,
    );
  }
}

export default UndeclaredAbstractMethodError;
