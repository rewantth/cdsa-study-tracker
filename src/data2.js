/* ---------- content: practice, exam, jobs ---------- */
var ACADEMY = 'https://academy.hackthebox.com/course/preview/';
var LABS = [
 {name:'Sherlocks', blurb:'Short blue-team investigations on HTB Labs. Good for building your own method. Write each one up.', items:[
  {id:'unit42', name:'Unit42', note:'Very easy and built on Sysmon logs. Try it after Windows Event Logs & Finding Evil.'},
  {id:'brutus', name:'Brutus'}, {id:'meerkat', name:'Meerkat'}, {id:'loggy', name:'Loggy'}, {id:'ufo1', name:'UFO-1'}, {id:'noxious', name:'Noxious'}
 ]},
 {name:'SIEM practice', blurb:'Get fast in Splunk and Elastic. The exam lives in a SIEM.', items:[
  {id:'bots', name:'Boss of the SOC (BOTS) datasets', note:'Free Splunk datasets. Splunk Enterprise is free for 60 days, so install it right before you start.', link:'https://github.com/splunk/botsv3'},
  {id:'xintra', name:'Xintra labs free trial', note:'Reported as a 7-day trial with two labs on Elastic. Start it after SIEM Fundamentals and block a few evenings.'}
 ]},
 {name:'Official prep and reading', blurb:'', items:[
  {id:'prep', name:'CDSA Preparation track', kind:'count', total:11, label:'scenarios', note:'11 scenarios on HTB Labs, very easy to hard. Check the exact access terms on HTB.', link:'https://roadmap.hackthebox.com/changelog/htb-certified-defensive-security-analyst-cdsa-preparation-track'},
  {id:'dfirr', name:'The DFIR Report case studies', kind:'count', total:5, label:'reports read', note:'Read real intrusion reports and note how each one is structured. Aim for five.', link:'https://thedfirreport.com'}
 ]}
];

var RESOURCES = [
 {id:'r-path', name:'SOC Analyst job-role path', host:'academy.hackthebox.com', url:'https://academy.hackthebox.com/path/preview/soc-analyst', desc:'The 15 modules you need at 100% before the exam.', type:'Official'},
 {id:'r-prep', name:'CDSA Preparation track announcement', host:'roadmap.hackthebox.com', url:'https://roadmap.hackthebox.com/changelog/htb-certified-defensive-security-analyst-cdsa-preparation-track', desc:'The 11 prep scenarios on HTB Labs.', type:'Official'},
 {id:'r-sysmon', name:'Sysmon documentation', host:'learn.microsoft.com', url:'https://learn.microsoft.com/en-us/sysinternals/downloads/sysmon', desc:'Every Sysmon event ID in one place.', type:'Reference'},
 {id:'r-uws', name:'Windows Security Log Encyclopedia', host:'ultimatewindowssecurity.com', url:'https://www.ultimatewindowssecurity.com/securitylog/encyclopedia/', desc:'Look up any Windows event ID and its fields.', type:'Reference'},
 {id:'r-attack', name:'MITRE ATT&CK', host:'attack.mitre.org', url:'https://attack.mitre.org/', desc:'Look up any technique and how it is detected.', type:'Reference'},
 {id:'r-spl', name:'Splunk SPL reference', host:'docs.splunk.com', url:'https://docs.splunk.com/Documentation/Splunk/latest/SearchReference/WhatsInThisManual', desc:'Search command reference.', type:'Reference'},
 {id:'r-kql', name:'Kibana Query Language (KQL)', host:'elastic.co', url:'https://www.elastic.co/guide/en/kibana/current/kuery-query.html', desc:'Syntax for Discover.', type:'Reference'},
 {id:'r-wsdoc', name:'Wireshark documentation', host:'wireshark.org', url:'https://www.wireshark.org/docs/', desc:'User guide and display filter reference.', type:'Reference'},
 {id:'r-suri', name:'Suricata documentation', host:'docs.suricata.io', url:'https://docs.suricata.io/', desc:'Rule format and configuration.', type:'Reference'},
 {id:'r-zeek', name:'Zeek documentation', host:'docs.zeek.org', url:'https://docs.zeek.org/', desc:'Log formats and scripting.', type:'Reference'},
 {id:'r-yara', name:'YARA documentation', host:'yara.readthedocs.io', url:'https://yara.readthedocs.io/', desc:'Rule syntax and modules.', type:'Reference'},
 {id:'r-sigma', name:'SigmaHQ rules', host:'github.com', url:'https://github.com/SigmaHQ/sigma', desc:'Thousands of community detection rules to read.', type:'GitHub'},
 {id:'r-chainsaw', name:'Chainsaw', host:'github.com', url:'https://github.com/WithSecureLabs/chainsaw', desc:'Hunt through Windows event logs with Sigma rules (used in the YARA & Sigma module).', type:'Tool'},
 {id:'r-hayabusa', name:'Hayabusa', host:'github.com', url:'https://github.com/Yamato-Security/hayabusa', desc:'Fast Windows event log timeline and threat hunting tool.', type:'Tool'},
 {id:'r-ez', name:'Eric Zimmerman tools', host:'ericzimmerman.github.io', url:'https://ericzimmerman.github.io/', desc:'Free forensic artefact parsers used by many analysts.', type:'Tool'},
 {id:'r-vol', name:'Volatility 3', host:'github.com', url:'https://github.com/volatilityfoundation/volatility3', desc:'Memory forensics framework.', type:'Tool'},
 {id:'r-cyber', name:'CyberChef', host:'gchq.github.io', url:'https://gchq.github.io/CyberChef/', desc:'Decode and transform data: base64, XOR, hex and more.', type:'Tool'},
 {id:'r-vt', name:'VirusTotal', host:'virustotal.com', url:'https://www.virustotal.com/', desc:'Check hashes, files, domains and IPs.', type:'Tool'},
 {id:'r-splunk', name:'Splunk Enterprise download', host:'splunk.com', url:'https://www.splunk.com/en_us/download/splunk-enterprise.html', desc:'Free trial for your own practice instance.', type:'Tool'},
 {id:'r-evtx', name:'EVTX-ATTACK-SAMPLES', host:'github.com', url:'https://github.com/sbousseaden/EVTX-ATTACK-SAMPLES', desc:'Real attack logs to practise on offline.', type:'Dataset'},
 {id:'r-bots', name:'Boss of the SOC v3 dataset', host:'github.com', url:'https://github.com/splunk/botsv3', desc:'Free Splunk practice data.', type:'Dataset'},
 {id:'r-atomic', name:'Atomic Red Team', host:'github.com', url:'https://github.com/redcanaryco/atomic-red-team', desc:'Small attack tests: run one, then find it in your logs.', type:'GitHub'},
 {id:'r-dfir', name:'The DFIR Report', host:'thedfirreport.com', url:'https://thedfirreport.com', desc:'Real intrusion write-ups with timelines.', type:'Reading'},
 {id:'r-obs', name:'Obsidian', host:'obsidian.md', url:'https://obsidian.md', desc:'Notes app for your cheat sheets and exam notes (Windows and Mac).', type:'Tool'}
];
var RES_TYPES = ['All','Official','Reference','Tool','Dataset','GitHub','Reading'];
var REVIEW_DAYS = [1,3,7,14,30];

var GATE = [
 {k:'path', t:'SOC Analyst path is at 100% (HTB requires it before you can sit the exam)', auto:true},
 {k:'hints', t:'I can finish the preparation scenarios without hints'},
 {k:'mock', t:'I have written at least one complete mock report'},
 {k:'notes', t:'My notes and cheat sheets work offline and I can find things fast'},
 {k:'tmpl', t:'My report template and timeline format are ready'},
 {k:'voucher', t:'Voucher bought and seven days blocked on my calendar'},
 {k:'plan', t:'I will write the report while I investigate, not after'}
];

var EXAM_FACTS = [
 ['7 days','to complete the exam'],
 ['2 attempts','per voucher'],
 ['20 MB','report size limit (PDF or ZIP)'],
 ['~20 days','typical wait for results']
];
var EXAM_NOTES = [
 'Two parts: the lab (you need a minimum number of points, which HTB does not publish) and then a graded report.',
 'You must complete 100% of the SOC Analyst path before you can sit the exam.',
 'The report is submitted unencrypted as a PDF or ZIP.',
 'Prices change. At the time of research a voucher was about $210 and the Silver Annual plan about $490 with one voucher included, but check HTB before you buy.'
];

var EVENTS = [
 ['A process started by an odd parent, like cmd.exe from notepad.exe','Sysmon 1, Security 4688','Parent and child, command line, user, hash'],
 ['Many failed logons, then a success','Security 4625, then 4624','Source IP, logon type, which account'],
 ['Something touching lsass.exe','Sysmon 10','Calling process and access mask. Possible credential dumping'],
 ['A new service appears','System 7045, Security 4697','Service name, binary path, account'],
 ['Event log cleared','Security 1102, System 104','Who cleared it, and what happened just before'],
 ['Lots of service ticket requests','Security 4769','Possible Kerberoasting: requesting account, encryption type'],
 ['Outbound connection from an unusual process','Sysmon 3, DNS in Sysmon 22','Destination, port, process, then the lookup that came first'],
 ['New persistence','Sysmon 11 and 13, Security 4698','File path, Run keys, scheduled tasks']
];

var TIMELINE_TPL = 'Time (UTC) | Host | Source | What happened | Evidence | ATT&CK\n2025-01-01 09:14 | WS-01 | Sysmon 1 | winword.exe spawned powershell.exe | Event record ID, command line | T1059.001\n';
var REPORT_TPL = '# Incident report\n\n## 1. Executive summary\nThree to five lines: what happened, impact, current status.\n\n## 2. Scope and sources\nHosts, accounts and log sources reviewed.\n\n## 3. Timeline\nUTC times, one line per event, each with evidence.\n\n## 4. Findings\nOne subsection per question: answer first, then the evidence.\n\n## 5. Indicators of compromise\nHashes, IPs, domains, file paths, accounts.\n\n## 6. Recommendations\nContainment, eradication, recovery and detection improvements.\n';
var FOLDER_TPL = '00-Inbox/\n01-Modules/\n  Basics/\n  SOC-Analyst/\n02-Cheatsheets/\n  Windows-event-IDs.md\n  Sysmon-events.md\n  SPL-and-KQL-queries.md\n  Wireshark-filters.md\n03-Sherlocks-and-labs/\n04-Report-template/\n05-Exam/\n  timeline.md\n  findings.md\n  report-draft.md\n';


