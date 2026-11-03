/* ---------- content: what to practise after each module ----------
   Gathered from HTB's own pages and from write-ups by people who passed the CDSA, plus public lab catalogues.
   Entry: [name, source, level, what it trains, priority ('core' = do it, 'extra' = if you have time), optional url] */
var SRC = {
  htb:   {n:'HTB Sherlocks', u:'https://app.hackthebox.com/sherlocks'},
  cyd:   {n:'CyberDefenders', u:'https://cyberdefenders.org/blueteam-ctf-challenges/'},
  bots:  {n:'Splunk BOTS', u:'https://github.com/splunk/botsv1'},
  mta:   {n:'Malware-Traffic-Analysis', u:'https://malware-traffic-analysis.net/training-exercises.html'},
  dfirr: {n:'The DFIR Report', u:'https://thedfirreport.com'},
  evtx:  {n:'EVTX samples', u:'https://github.com/sbousseaden/EVTX-ATTACK-SAMPLES'},
  rep:   {n:'Report practice', u:'https://docs.sysreptor.com/htb-reporting-with-sysreptor'},
  drill: {n:'Drill', u:''}
};
var PROBLEMS = {
 net:[
  ['Subnet ten random networks by hand','drill','Basic','Range, mask and broadcast without a calculator.','core'],
  ['Capture your own browsing in Wireshark','drill','Basic','Find the DNS query, the TCP three-way handshake and the TLS hello. Annotate each packet in your notes.','core'],
  ['Write a one-page port cheat sheet','drill','Basic','53 DNS, 88 Kerberos, 389/636 LDAP, 445 SMB, 3389 RDP, 5985/5986 WinRM. You will reuse it all path.','core']],
 winf:[
  ['List what is normal on a clean Windows VM','drill','Basic','Processes and their parents, services, scheduled tasks. Knowing normal is how you spot evil.','core'],
  ['Find three persistence locations in the registry','drill','Basic','Run and RunOnce keys, services, scheduled tasks. Note what a legitimate entry looks like.','core'],
  ['Find a logon event in Event Viewer','drill','Basic','Locate a 4624, read the logon type and account fields.','core']],
 wcl:[
  ['Pull failed logons with Get-WinEvent','drill','Basic','Use -FilterHashtable for event ID 4625 in the last 24 hours. This is a direct exam skill.','core'],
  ['List auto-start services that are not from Microsoft','drill','Basic','Practise filtering with Where-Object and Select-Object.','core'],
  ['Decode a base64 PowerShell command','drill','Basic','Take any -EncodedCommand string and decode it in PowerShell or CyberChef.','extra']],
 ad:[
  ['Draw a small forest with two domains','drill','Basic','Mark domain controllers, OUs and where Domain Admins live.','core'],
  ['Write the Kerberos steps from memory','drill','Basic','AS-REQ, TGT, TGS-REQ, service ticket. Compare with the module afterwards.','core'],
  ['Build a tiny AD lab in a VM','drill','Basic','One domain controller and one client. Create users, a group and a GPO, then read the logs it produces.','extra']],
 web:[['Read raw HTTP with curl -v','drill','Basic','Find a 301, a 403 and a 500 and explain each one.','core']],
 nmap:[['Compare -sS and -sT in a capture','drill','Basic','Scan your own VM while capturing in Wireshark and note which packets reveal the scan type.','core']],
 ptp:[['Map each pentest stage to the Kill Chain and ATT&CK','drill','Basic','One line per stage: what the attacker does and what you would see in logs.','core']],
 lin:[
  ['Find a failed SSH login in the logs','drill','Basic','Search /var/log/auth.log or journalctl with grep, then count the top source IPs.','core'],
  ['Brutus','htb','Very Easy','Linux auth.log and wtmp evidence of an SSH brute force. A good first Linux investigation.','extra']],
 bash:[['Count failed logins per IP with a script','drill','Basic','Loop over a log file and print the top offenders.','core']],
 asm:[['Step through a tiny binary in GDB','drill','Basic','Single-step the first ten instructions and name each register change.','core']],

 ih:[
  ['Read one full DFIR Report case','dfirr','Reading','Label every event with a Kill Chain stage and note what you would have detected, contained and fixed.','core'],
  ['Write a one-page playbook for a ransomware alert','drill','Basic','Preparation, detection, containment, eradication, recovery and lessons learned, in your own words.','extra']],
 siem:[
  ['REvil - GOLD SOUTHFIELD','cyd','Easy','Investigate ransomware behaviour in Sysmon logs inside an Elastic SIEM, the same tool as this module.','core'],
  ['Rebuild the four SIEM visualisations yourself','drill','Basic','Failed logons, disabled users, RDP by service accounts, local group changes. Do not just read them.','core'],
  ['Write your own triage checklist','drill','Basic','True or false positive, severity, scope, escalate. You will reuse it in the exam.','extra']],
 wel:[
  ['Unit42','htb','Very Easy','Sysmon logs and a backdoored tool used for persistence. Your first Windows log investigation.','core'],
  ['LogJammer','htb','Easy','Windows event logs: firewall rule changes, audit policy changes, scheduled tasks and cleared logs.','core'],
  ['Name the technique in five EVTX samples before reading the label','evtx','Practice','Open attack logs offline and say what happened before checking the answer.','extra']],
 hunt:[
  ['GoldenSpray','cyd','Medium','Elastic and Sysmon: build an intrusion timeline and name the attacker techniques.','core'],
  ['ElasticCase','cyd','Medium','A simulated multi-stage attack to hunt through in Elastic SIEM.','extra'],
  ['BumbleBee - GOLD CABIN','cyd','Medium','Trace an attack from initial access to ransomware using ELK, Windows event logs and Sysmon.','extra']],
 splog:[
  ['Splunk BOTS v1: first 15 questions','bots','Medium','The standard Splunk investigation dataset. Do it without reading write-ups. Install Splunk Enterprise only when you start (free trial is limited).','core'],
  ['Ten SPL searches from scratch','drill','Basic','stats, table, rex, eval, sort, dedup, timechart. Save each query in your notes.','core'],
  ['T1197','cyd','Medium','Find BITS and LOLBAS abuse and persistence in Windows logs with Splunk.','extra']],
 waad:[
  ['Campfire-1','htb','Very Easy','Kerberoasting traced through Active Directory logs in Elastic.','core'],
  ['Campfire-2','htb','Very Easy','AS-REP roasting investigated through ELK. Pairs with the previous one.','core'],
  ['Attack and detection cards','drill','Basic','One card per attack: the technique, the tool, the event IDs, one mitigation.','core']],
 dwas:[
  ['Kerberoasted','cyd','Medium','Detect and respond to Kerberoasting, find compromised accounts and persistence in Kerberos logs.','core'],
  ['Splunk BOTS v1: the rest','bots','Medium','Finish the dataset. The exam rewards fast, confident SIEM searching.','core'],
  ['Midnight RDP','cyd','Hard','Reconstruct an intrusion that began with RDP access: persistence, privilege escalation and C2, all in Splunk.','extra'],
  ['Rhysida - Vice Society','cyd','Medium','Rebuild a ransomware attack chain in Splunk.','extra']],
 nta1:[
  ['Three newest Malware-Traffic-Analysis exercises','mta','Practice','Packet captures with a question: what is the infection chain and what malware is it? The site advises starting with the most recent ones.','core'],
  ['PacketDetective','cyd','Easy','Extract indicators of compromise from a PCAP with only Wireshark.','core'],
  ['Noxious','htb','Very Easy','A network capture investigation in Wireshark. Redo it after the module.','core']],
 nta2:[
  ['Litter','htb','Easy','Protocol analysis in Wireshark, decoding values with CyberChef and spotting a DNS tunnelling tool.','core'],
  ['Unit 42 Wireshark quizzes','mta','Practice','Short quiz-style captures with separate answer pages, linked from the same site.','core']],
 ids:[
  ['Meerkat','htb','Easy','PCAP plus Suricata and Zeek logs: tell credential stuffing from other brute force and research the exploited CVE.','core'],
  ['Write a Suricata rule for a capture','drill','Basic','Pick an exercise PCAP, write a rule that fires on one behaviour, then test it.','core'],
  ['WebStrike','cyd','Beginner','A web server compromise across initial access, execution, persistence, C2 and exfiltration.','extra']],
 mal:[
  ['RogueOne','htb','Easy','Memory forensics to find a malicious process, its C2 activity and network connections.','core'],
  ['Triage an unknown sample','drill','Basic','Hash it, read its strings, look it up in VirusTotal and write down every indicator.','core'],
  ['ReliableThreat','htb','Medium','A malicious VS Code extension leading to a reverse shell, plus COM hijacking for persistence.','extra'],
  ['Amadey','cyd','Easy','Endpoint forensics on a malware infection.','extra']],
 jsd:[
  ['Bumblebee','htb','Easy','Analyse malicious JavaScript that steals credentials, plus SQLite forensics and LDAP.','core'],
  ['Deobfuscate a minified script','drill','Basic','Beautify it, rename three variables, and write down what it does.','core']],
 ys:[
  ['Run Chainsaw with Sigma rules on EVTX samples','evtx','Practice','See which Sigma rules fire on real attack logs, then open the log to confirm.','core'],
  ['Write a YARA rule for a sample you analysed','drill','Basic','Strings plus a condition. Test it against a clean file to check for false positives.','core'],
  ['Read ten Sigma rules from SigmaHQ','drill','Reading','Say what each one detects and which log source it needs.','extra']],
 dfir:[
  ['Recollection','htb','Easy','Memory forensics on a Windows image, including obfuscated PowerShell.','core'],
  ['Trojan','htb','Easy','Volatility 3 analysis of a malicious ZIP and a compromised workstation.','core'],
  ['Tracer','htb','Easy','PsExec lateral movement, Prefetch, service binaries and named pipes.','core'],
  ['Jinkies','htb','Medium','Triage artefacts: shares, process logs, registry, with an OSINT element.','extra'],
  ['Heartbreaker','htb','Medium','A medium DFIR investigation, recommended by people who passed.','extra'],
  ['APTNightmare','htb','Medium','Another medium DFIR case from the same recommendations.','extra']],
 rep:[
  ['Write a mock report for Unit42','rep','Report','Use the HTB CDSA template in SysReptor, with a timeline, evidence per finding and remediation advice.','core'],
  ['Write a second mock report for a Medium lab','rep','Report','Pick a Medium Sherlock and time yourself. Practise writing as you investigate.','core'],
  ['Compare against the sample CDSA report','rep','Reading','Read the sample report PDF and list what yours is missing.','core','https://docs.sysreptor.com/assets/reports/HTB-CDSA-Report.pdf']]
};
var FINAL_PROBLEMS = [
  ['CDSA Preparation track: all 11 scenarios','htb','Very Easy to Hard','Redo every scenario where you needed hints, until you can finish without them. HTB suggests this is the readiness bar.','core','https://roadmap.hackthebox.com/changelog/htb-certified-defensive-security-analyst-cdsa-preparation-track'],
  ['Splunk BOTS v1 from start to finish, no write-ups','bots','Medium','A full SIEM investigation under your own steam.','core'],
  ['Timed mock exam: one Medium Sherlock, 48 hours, full report','rep','Mock','Build the timeline from minute one, screenshot as you go, and write the report during the investigation.','core'],
  ['Hafnium APT','cyd','Hard','Reconstruct initial access, persistence and lateral movement from Elastic, Sysmon and Windows logs.','extra'],
  ['Detroit Becomes Human','htb','Hard','Malware delivered through a social media link, with event log and PowerShell analysis.','extra'],
  ['Exam environment check','drill','Basic','Confirm VPN, notes app, screenshot tool and report template all work before you book.','core']
];
var PASSER_TIPS = [
  ['Write the report as you investigate. Treat it as half the exam from day one, and paste the evidence and one sentence of explanation after each confirmed finding.','CertCrush'],
  ['Explore the exam environment first to find your tools and evidence. Start with the first incident to build momentum; wrong flag answers carry no penalty.','Nullpoint'],
  ['Build a timeline from the first minute so you do not repeat steps, and save every query next to its screenshot.','Nullpoint, HTB interview'],
  ['Document your assumptions in the report wherever the evidence has a gap. Not every step of an incident can be proven.','Nullpoint'],
  ['Practise a Sherlock and write a mock report on it well before the exam.','HTB interview with a first-blood winner'],
  ['Sherlocks have far less evidence than the exam and no time limit by default, so add your own time limit.','Reviews of the exam'],
  ['Weak spots people named: threat hunting in Elastic, threat hunting in Splunk and memory analysis with Volatility.','Nullpoint'],
  ['Do not speedrun the path. Build a cheat sheet per module: tool commands and SIEM queries.','HTB interview, passer reviews'],
  ['If you are stuck for a long time, move on and come back with fresh eyes. Use all seven days.','HTB interview, passer reviews'],
  ['The SysReptor template for the HTB CDSA report saved several people a lot of formatting time.','Passer reviews']
];
