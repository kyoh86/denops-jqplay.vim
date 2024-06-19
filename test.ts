const pattern1 = new URLPattern({ hostname: "example.com", protocol: "https" });
const pattern2 = new URLPattern({ hostname: "example.com", protocol: "test" });
console.log(pattern1.exec("https://example.com/"));
console.log(pattern2.exec("https://example.com/"));
console.log(pattern1.exec("test://example.com/"));
console.log(pattern2.exec("test://example.com/"));
