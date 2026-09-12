export type ArticleNavigationEntry = {
  slug: string;
  title: string;
  timestamp: string;
  tags: string[];
};

export const articleNavigation: ArticleNavigationEntry[] = [
  { slug: "microvms-vs-containers-for-multitenant-workloads", title: "MicroVMs vs Containers for Multi-Tenant Workloads", timestamp: "2026-09-12T10:10:00+00:00", tags: ["microvms", "containers", "firecracker", "cloud", "security", "multi-tenancy"] },
  { slug: "rust-vs-go-for-infrastructure-backends", title: "Rust vs Go for Infrastructure Backends", timestamp: "2026-09-12T10:05:00+00:00", tags: ["rust", "go", "backend", "systems", "infrastructure"] },
  { slug: "designing-a-reliable-kubernetes-platform", title: "Designing a Reliable Kubernetes Platform for Small Teams", timestamp: "2026-09-12T10:00:00+00:00", tags: ["kubernetes", "platform-engineering", "devops", "observability", "infrastructure"] },
  { slug: "mikrom-close-to-production", title: "Mikrom Is Close to Production", timestamp: "2026-08-30T12:00:00+02:00", tags: ["cloudflare", "neon", "postgres", "security", "observability", "microVM"] },
  { slug: "log-of-a-week-of-work-on-scratch", title: "Log of a Week of Work on Scratch", timestamp: "2026-08-23T18:00:00+02:00", tags: ["Rust", "Axum", "Next.js", "PostgreSQL", "NATS", "LLM", "OpenAPI"] },
  { slug: "introducing-scratch", title: "Introducing Scratch: A Web-Scraping Operations Platform", timestamp: "2026-08-16T10:00:00+02:00", tags: ["Rust", "Axum", "Next.js", "PostgreSQL", "Dagger", "data"] },
  { slug: "mikrom-august-2026-update", title: "Mikrom August 2026 Update", timestamp: "2026-08-06T12:00:00+02:00", tags: ["terraform", "ansible", "ceph", "rust", "eBPF", "observability", "microVM"] },
  { slug: "mikrom-july-2026-update", title: "Mikrom: Update of the Last 15 Days", timestamp: "2026-07-10T11:58:00+02:00", tags: ["rust", "security", "2FA", "Polar", "CLI", "eBPF", "Dagger", "microVM"] },
  { slug: "mikrom-june-2026-update", title: "Mikrom June 2026 Update", timestamp: "2026-06-02T08:15:00+00:00", tags: ["firecracker", "cloud-hypervisor", "rust", "mikrom", "6PN", "Neon", "Dagger"] },
  { slug: "kubernetes-operator-for-mikrom", title: "Building a Kubernetes Operator for Mikrom", timestamp: "2026-04-09T12:00:00+00:00", tags: ["kubernetes", "operator", "firecracker", "go", "mikrom", "kubebuilder", "controller-runtime"] },
  { slug: "integrating-mikrom-agent-with-firecracker-containerd", title: "Integrating mikrom-agent with firecracker-containerd", timestamp: "2026-04-07T10:00:00+00:00", tags: ["firecracker", "containerd", "grpc", "go", "mikrom", "protobuf", "debugging"] },
  { slug: "debugging-firecracker-containerd", title: "Debugging firecracker-containerd from scratch", timestamp: "2026-04-05T12:00:00+00:00", tags: ["firecracker", "containerd", "devmapper", "go", "mikrom", "linux"] },
  { slug: "firecracker-and-buildpacks", title: "Firecracker and Buildpacks", timestamp: "2026-03-29T15:15:00+00:00", tags: ["firecracker", "buildpacks", "go", "mikrom"] },
  { slug: "understanding-grpc-and-protocol-buffers", title: "gRPC and Protocol Buffers for Backend Services", timestamp: "2026-02-05T22:06:00+00:00", tags: ["grpc", "google", "json", "api", "rest"] },
  { slug: "getting-started-with-axum-and-tokio", title: "Building a REST API with Axum and Tokio", timestamp: "2025-12-31T22:00:00+00:00", tags: ["rust", "tokio", "axum", "async", "programming", "api"] },
  { slug: "knative-simplifying-serverless-development-on-kubernetes", title: "Knative for Serverless Workloads on Kubernetes", timestamp: "2025-12-13T13:00:00+00:00", tags: ["knative", "edge", "5g", "iot", "serverless", "functions", "containers", "kubernetes"] },
  { slug: "micro-virtual-machines", title: "MicroVMs for Secure Multi-Tenant Edge Workloads", timestamp: "2025-05-17T01:37:02+00:00", tags: ["mikrom", "kvm", "virtualization", "edge", "5g", "iot"] },
  { slug: "guerrilla-open-manifesto", title: "Guerrilla Open Manifesto", timestamp: "2025-04-15T01:37:02+00:00", tags: ["manifesto", "activism", "science"] },
];
