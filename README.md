# nktty

Management and automation for remote hosts.

## How to install.

### Git:
```
git clone https://github.com/reekol/nktty
cd nktty
npm i
```
- Run:
```bin/nktty.js --help```

### Standalone binary:
Download builds for your distro from [Releases](https://github.com/reekol/nktty/releases) section.

- Run:
```bash
./nktty-linux -C ../config/commandsAll.json -E ../config/execute.json -R ../config/remotes.json --remotes="host1|host2"
# OR for other options
./nktty-linux --help
```

## Options:
```
Options:
  -r, --remotes             Filter remote hosts.(regex)                 [string]
  -e, --execute             Filter tasks to executed.(regex)            [string]
  -u, --ude                 User Defined Execution: (Command).          [string]
  -R, --config-remotes      override path to reomtes.json               [string]
  -C, --config-commandsall  override path to commandsAll.json           [string]
  -E, --config-execute      override path to execute.json               [string]
  -h, --help                Show help                                  [boolean]
  -v, --version             Show version number                        [boolean]
```

## Configure: 
+ ./config/remotes.json (List of all hosts to be monitored/used).
+ - Example:
```json
...
 { 
 	"title": "host1 title",
 	"addr": "192.168.1.1",
 	"user": "root",
 	"port":22,
 	"keyFile":"/home/user/.ssh/id_rsa",
 	"cmd":null 
 },
 ...
```
+ ./config/commandsAll.json (commands used only in UI mode, to show/check system information)
+ - Example:
```json
...
{
	"name":" Rand percent ",
	"cmd":"echo $(( ( RANDOM % 100 )  + 1 ))",
	"type":"bar",
	"suffix":"%"
},
...
```

+ ./config/execute.json ("Stage two" commands available for each selected host)
+ - Example:
```json
...
{
	"title": "Log",
	"cmd": "dmesg"
},
...
```

## Eamples:
- Shows and checks only selected hosts.
```nktty --remotes="host1|host2|host3"```
- + Select a host and hit enter, than select an initial command. You will be redirected into fully functional interactive command shell.

- Execute predefined commands on selected hosts.
```nktty --remotes="host1|host2|host3" --execute="command1|command2|command3"```

- Execute user defined commands [--ude] on selected hosts.
```nktty --remotes="host1|host2|host3" --ude="whoami"```

- Live monitor of multiple hosts [ kernel.log ]
```nktty.js --remotes='host1|host2' --ude='tail -F /var/log/kern.log'```

The output of non interactive execution will contain something like:
Cmd:
```bash
nktty --remotes='host1|host2' --ude='whoami'
```

```XML
<STDOUT time="2021-02-27T15:13:19.441Z" host="host1" command="U.D.E."><![CDATA[
root
]]></STDOUT>
<STDOUT time="2021-02-27T15:13:19.443Z" host="host1" command="U.D.E."><![CDATA[
root
]]></STDOUT>
```
## Useful commands to try:
#
---
```bash
nktty --remotes='host1|host2' --ude='tail -F /var/log/kern.log'
```
The output from the command above will be updated live in your terminal.
Output:
```XML
...
<STDOUT time="2021-02-27T15:43:17.315Z" host="host1" command="U.D.E."><![CDATA[
Feb 27 17:43:17 localhost kernel: [353444.072757] w1_master_driver w1_bus_master1: Attaching one wire slave 00.9b3800000000 crc 6a
]]></STDOUT>
<STDOUT time="2021-02-27T15:43:17.321Z" host="host1" command="U.D.E."><![CDATA[
Feb 27 17:43:17 localhost kernel: [353444.085895] w1_master_driver w1_bus_master1: Family 0 for 00.9b3800000000.6a is not registered.
]]></STDOUT>
<STDOUT time="2021-02-27T15:43:17.322Z" host="host1" command="U.D.E."><![CDATA[
Feb 27 17:43:17 localhost kernel: [353444.085895] w1_master_driver w1_bus_master1: Family 0 for 00.9b3800000000.6a is not registered.
]]></STDOUT>
...
```
#
---
```bash
nktty --remotes='host1|host2' --execute='port'
```
Output:
```XML
<STDOUT time="2021-02-27T15:16:45.596Z" host="host1 title" command="Scan servces per port"><![CDATA[
sshd     22    2
node     3001  1
apache2  443   1
named    53    5
apache2  80    1
named    953   2
]]></STDOUT>
<STDOUT time="2021-02-27T15:16:45.606Z" host="host2 title" command="Scan servces per port"><![CDATA[
sshd     22    2
node     3001  1
apache2  443   1
named    53    5
apache2  80    1
named    953   2
]]></STDOUT>
```
#
---
```bash
nktty --remotes='host' --ude='ping -c 192.168.1.1'
```
Check if IP is accessible from all of the remote hosts.
Output:
```XML
...
<STDOUT time="2021-02-27T16:25:14.685Z" host="host1" command="U.D.E."><![CDATA[
64 bytes from 192.168.1.1: icmp_seq=12 ttl=64 time=0.256 ms
]]></STDOUT>
<STDOUT time="2021-02-27T16:25:14.693Z" host="host2" command="U.D.E."><![CDATA[
64 bytes from 192.168.1.1: icmp_seq=12 ttl=64 time=0.234 ms
]]></STDOUT>
<STDOUT time="2021-02-27T16:25:14.716Z" host="host2" command="U.D.E."><![CDATA[
64 bytes from 192.168.1.1: icmp_seq=12 ttl=64 time=0.226 ms
]]></STDOUT>
<STDOUT time="2021-02-27T16:25:14.717Z" host="host1" command="U.D.E."><![CDATA[
64 bytes from 192.168.1.1: icmp_seq=12 ttl=64 time=0.326 ms
]]></STDOUT>
...
```
#

## Errors:

When Error is received, output tag will be STDERR instead of STDOUT and will be coloured in red.

Example:
```bash
nktty -r '*' -u 'asdd'
```
Output:

```XML
...
<STDERR time="2021-02-27T17:05:57.741Z" host="host2" command="U.D.E."><![CDATA[
bash: asdd: command not found
]]></STDERR>
<STDERR time="2021-02-27T17:05:57.779Z" host="host1" command="U.D.E."><![CDATA[
bash: asdd: command not found
]]></STDERR>
<STDERR time="2021-02-27T17:05:57.779Z" host="host3" command="U.D.E."><![CDATA[
bash: asdd: command not found
]]></STDERR>
...
```

#
## How it works?
 nktty is single threaded, non blocking, asynchronous process running on your machine.
 - Initial checks (./config/commandsAll.json), are executed in parallel manner on remote hosts and collected in asynchronous manner.
 - Execution: (./config/execute.json). Every matching command in every selected host is executed in parallel with others, per host. So you will have multiple commands running (if more than one is matched) on every matched host. 
 - User defined execution \[Same as previous	but with user provided command\].
 - Output of --execute and --ude is XML formatted and contains following properties.
 - + Tag: STDOUT (green) or STDERR (red) depending on the received data type.
 - + time: time of receiving the output based on user's clock.
 - + host: Title of the host of which it was received.
 - + command: Title of the command executed (Or U.D.E. when --ude, -u options are used).
 - + <!\[CDATA\[\n .. \n\]\]> containing the actual output.
