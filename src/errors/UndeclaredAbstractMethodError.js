class UndeclaredAbstractMethodError extends Error {
  constructor (method, instance) {
    super(`You should declare the '${method}' abstract method in the ${instance.constructor.name} class!`)
  }
}

export default UndeclaredAbstractMethodError
