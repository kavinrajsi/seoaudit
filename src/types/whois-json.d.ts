declare module 'whois-json' {
  /**
   * whois-json default export: takes a domain and returns parsed WHOIS data as any
   */
  function whois(domain: string): Promise<any>;
  export default whois;
}
