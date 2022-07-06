export default interface Service {
  init: () => Promise<void>
}
