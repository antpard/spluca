---
layout: ../../layouts/ServiceLayout.astro
title: "Linux System Administration"
description: "Linux server hardening, administration, and incident-focused support for Red Hat and Debian-based systems. Work through security, networking, patching, and reliability concerns across VPS, cloud, and bare-metal infrastructure."
tags: ["Linux", "SysAdmin", "Red Hat", "Debian", "Security", "Networking"]
featured: true
timestamp: "2026-04-07"
filename: "linux-system-administration"
---

## Overview

I work with teams facing security gaps, recurring incidents, or unclear operational ownership in their Linux infrastructure. The work can range from a few VPS instances to bare-metal servers across Red Hat and Debian ecosystems, depending on the situation.

## Red Hat Ecosystem

**Often a good fit for:** Enterprise environments, compliance-driven workloads, and organizations that need long-term stability with commercial support.

- **RHEL, AlmaLinux & Rocky Linux** — Installation, configuration, and lifecycle management
- **DNF/YUM** — Package management, repository configuration, and module streams
- **SELinux** — Policy design, troubleshooting, and enforcing-mode deployments
- **firewalld & nftables** — Zone-based firewall rules and advanced packet filtering
- **NetworkManager & systemd-networkd** — Bonding, bridging, VLANs, and routing
- **Cockpit & Satellite** — Web-based administration and centralized fleet management

## Debian Ecosystem

**Often a good fit for:** Community-driven projects, web servers, containers, and teams that value flexibility and a broad package ecosystem.

- **Debian & Ubuntu** — LTS releases, point upgrades, and minimal installs
- **APT** — Package management, PPAs, pinning, and local mirrors
- **AppArmor** — Mandatory access control profiles for application sandboxing
- **UFW & iptables/nftables** — Simple and advanced firewall configurations
- **Netplan & ifupdown** — Declarative network configuration
- **Landscape & Ansible** — Centralized management and configuration automation

## Security & Hardening

- **Kernel hardening** — sysctl tuning, module blacklisting, and secure boot
- **SSH** — Key-based auth, bastion hosts, and fail2ban integration
- **Audit & compliance** — CIS benchmarks, Lynis audits, and remediation scripts
- **Intrusion detection** — AIDE file integrity monitoring and log analysis
- **Backup strategies** — rsync, BorgBackup, and off-site replication

## Networking

- **Routing & NAT** — Static routes, policy routing, and masquerading
- **DNS** — BIND, Unbound, and split-horizon configurations
- **Load balancing** — HAProxy and keepalived for high availability
- **VPN** — WireGuard, OpenVPN, and IPsec site-to-site tunnels
- **Monitoring** — Prometheus node exporter, netdata, and custom alerting

## How I Work

1. **Assessment** — Audit existing systems, identify bottlenecks and security gaps
2. **Planning** — Define architecture, migration strategy, and rollback procedures
3. **Implementation** — Deploy changes with minimal downtime using blue-green or canary approaches
4. **Documentation** — Runbooks, network diagrams, and configuration inventories
5. **Monitoring & maintenance** — Proactive alerting, patch management, and capacity planning
6. **Knowledge transfer** — Training your team and leaving clear operational procedures

## Technologies

| Category | Tools |
|---|---|
| **Red Hat** | RHEL, AlmaLinux, Rocky, DNF, SELinux, firewalld, Cockpit, Satellite |
| **Debian** | Debian, Ubuntu, APT, AppArmor, UFW, Netplan, Landscape |
| **Security** | OpenSSH, fail2ban, AIDE, Lynis, CIS-CAT, WireGuard |
| **Networking** | HAProxy, keepalived, BIND, Unbound, nftables, iptables |
| **Automation** | Ansible, Bash, systemd, cron, Prometheus, netdata |
