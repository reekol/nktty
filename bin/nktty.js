#!/usr/bin/env node
const os = require('os')
const fs = require('fs')
const yargs = require('yargs')
const SSH2 = require('ssh2')
const cliProgress = require('cli-progress')
const colors = require('colors')
const prompts = require('prompts')
const d = console.log
const cwd = process.cwd()
const username = require("os").userInfo().username

let cnfFileRemotes = 'remotes.json'
let cnfFileCommandsAll = 'commandsAll.json'
let cnfFileExecute = 'execute.json'

const argv = yargs
	.option('remotes', {
		alias: 'r',
		description: 'Filter remote hosts.(regex)',
		type: 'string',
	})
	.option('execute', {
		alias: 'e',
		description: 'Filter tasks to executed.(regex)',
		type: 'string',
	})
	.option('ude', {
		alias: 'u',
		description: 'User Defined Execution: (Command).',
		type: 'string',
	})
	.option('config-remotes', {
		alias: 'R',
		description: 'override path to reomtes.json',
		type: 'string',
	})
	.option('config-commandsall', {
		alias: 'C',
		description: 'override path to commandsAll.json',
		type: 'string',
	})
	.option('config-execute', {
		alias: 'E',
		description: 'override path to execute.json',
		type: 'string',
	})
	.option('config-build', {
		alias: 'B',
		description: 'Build example config. files',
		type: 'string',
	})
	.help()
	.alias('help', 'h')
	.version()
	.alias('version', 'v')
	.argv

prompts.override(yargs.argv)
if(argv.B){
	if(!fs.existsSync(argv.B)) throw new Error('Unable to create config files. Diretory ' + argv.B + ' does not exists!')
	let dirname = argv.B
	cnfFileRemotes = dirname + '/' + cnfFileRemotes
	cnfFileCommandsAll = dirname + '/' + cnfFileCommandsAll
	cnfFileExecute = dirname + '/' + cnfFileExecute

	if(fs.existsSync(cnfFileCommandsAll)) throw new Error('File ' + cnfFileCommandsAll + ' already exists.')
	if(fs.existsSync(cnfFileExecute)) throw new Error('File ' + cnfFileExecute + ' already exists.')
	if(fs.existsSync(cnfFileRemotes)) throw new Error('File ' + cnfFileRemotes + ' already exists.')

	d('Building configuration files.'.green)
	let exampleHost = {title: "host1",addr: "192.168.1.10",user: "root",port:22,keyFile:"/home/" + username + "/.ssh/id_rsa",cmd:null}
	let exampleCommands = [
		{name:"[RNG] ",  cmd: "echo $(( ( RANDOM % 100 )  + 1 ))", type: "bar", suffix: "%"},
		{name:" Time: ", cmd: "date +'%Y-%m-%d %H:%M:%S'", type: "text", suffix: ""}
	]
	let exampleStageTwo = [{title: "Terminal",cmd: " "},{title: "Htop",cmd: "htop"}]
	d('Creating: ' + cnfFileRemotes.green)
	fs.writeFileSync(cnfFileRemotes,JSON.stringify([exampleHost,exampleHost,exampleHost], null, 4))
	d('Creating: ' + cnfFileCommandsAll.green)
	fs.writeFileSync(cnfFileCommandsAll,JSON.stringify(exampleCommands, null, 4))
	d('Creating: ' + cnfFileExecute.green)
	fs.writeFileSync( cnfFileExecute,JSON.stringify(exampleStageTwo, null, 4))

	d('Example usage:'.yellow)
	d(('./' + argv['$0'] + ' -R ' + cnfFileRemotes + ' -C ' + cnfFileCommandsAll + ' -E ' + cnfFileExecute + ' ').white.bgBlack)
	process.exit()
}

let cnfFileGuess = (cnfFile) => {
	let f =  cnfFile.toString('utf8')
	cnfFile = os.homedir() + '/.nktty/' + f
	if(fs.existsSync(cnfFile)) return cnfFile
	cnfFile = cwd + '/' + f
	if(fs.existsSync(cnfFile)) return cnfFile
	cnfFile = cwd + '/config/' + f
	if(fs.existsSync(cnfFile)) return cnfFile
	throw new Error('No configuration found for: ' + f)
}

cnfFileRemotes = cnfFileGuess(cnfFileRemotes)
cnfFileCommandsAll = cnfFileGuess(cnfFileCommandsAll)
cnfFileExecute = cnfFileGuess(cnfFileExecute)
//d("Config files in use\n", cnfFileRemotes, cnfFileExecute, cnfFileCommandsAll)

const loadConf = (addr) => JSON.parse(fs.readFileSync(addr))
const cliParamParse = param => (param.charAt(0) === '@' ? fs.readFileSync(param.substring(1)) : param)

const hostsFull = loadConf( argv.R ? argv.R : cnfFileRemotes )
const commandsAll = loadConf( argv.C ? argv.C : cnfFileCommandsAll )
const stageTwo  = loadConf( argv.E ? argv.E : cnfFileExecute )

const initialRemotesFilter = typeof argv.remotes === 'undefined' ? '' : cliParamParse(argv.remotes)
const initialExecuteFilter = typeof argv.execute === 'undefined' ? '' : cliParamParse(argv.execute)
const initialUdeFilter     = typeof argv.ude     === 'undefined' ? '' : cliParamParse(argv.ude)

if(initialExecuteFilter !== '' && initialRemotesFilter === '')
	throw new Error('You can not set intial execution filters [--execute,-e] without setting initial remotes filter [--remotes,-r]')

if(initialUdeFilter     !== '' && initialRemotesFilter === '')
	throw new Error('You can not set User Defined Execution   [--ude,-u]     without setting initial remotes filter [--remotes,-r]')

if(initialUdeFilter     !== '' && initialExecuteFilter !== '')
	throw new Error('You should specify [--ude,-u] or [--execute,-e], not both.')

const suggestFnc = (input, choices) =>  Promise.resolve(choices.filter(i => {
	let res
	try{
		res = new RegExp(input).test(i.title)
	}catch(e){
		res = choices
	}
	return res
}))

let sortByVal = (a, b) => {
  let keyA = parseInt(a.value), keyB = parseInt(b.value)
  if (keyA < keyB) return -1
  if (keyA > keyB) return 1
  return 0
}

let cliBar = (name, percents, suffix) => {
	let bar = (name + Math.round(percents) + suffix).padEnd(10)
	percents = Math.ceil(percents/10)
	let barColored = ''
	let bgColor = percents < 8 ? 'bgGreen' : 'bgRed'
	let fgColor = percents < 8 ? 'black' : 'white'
	for (var i = 0; i < bar.length; i++) {
		barColored += (i < percents ? bar.charAt(i)[fgColor][bgColor] : bar.charAt(i).black.bgGray)
	}
	return barColored
}


let sshConn = async (options) => {
	options.readyTimeout = 3000
	return new Promise((resolve, reject) => {
		let conn = new SSH2()
		conn.
		on('ready', () => { resolve(conn) }).
		on('error', e => { reject(e) } ).
		connect(options)
	})
}

let sshExec = async (conn, cmd) => {
	return new Promise((resolve, reject) => {
		let received = ''
		conn.exec(cmd, (err, channel) => {
			if (err){ 
				reject(err)
				return false
			}
			channel.on('close', () => { resolve(received.toString('utf-8').trim()) })
			channel.on('data', chunk => { received += chunk })
		})
	})
}

let hostsInfo = async (i,h) => {
	let error = null
	let conn = null
	try{
		conn = await sshConn({
			host: h.addr,
			port: h.port,
			username: h.user,
			privateKey: fs.readFileSync(h.keyFile),
			agent: process.env.SSH_AUTH_SOCK,
			agentForward: true
		})
	}catch(e){ 
		error = e.message
	}
	h.value = i
	h.title = h.title.padEnd(20, ' ') + h.addr.padEnd(16,' ')
	h.title = '-' + (parseInt(i) + 1).toString().padEnd(2, ' ') + ') '.blue + h.title
	if(!conn){
		h.title +="Error!:".white.bgRed + (' ' + error + ' ').red.bgWhite
	}else{
		for(let command of h.cmd)
		{
			if(command.type === 'bar')
				h.title += ' ' + cliBar(command.name, await sshExec(conn,command.cmd), command.suffix)
			else if(command.type === 'text')
				h.title += ' ' + command.name + await sshExec(conn,command.cmd) + command.suffix
		}
		conn.end()
	}
	return h
}

let stageTwoLogin = (host,initialCommand) => {
	let gs = null
	var conn = new SSH2()
	conn.on('ready', () => {
		conn.shell(
		{
			term: 'xterm-256color',
			rows: process.stdout.rows,
			cols: process.stdout.columns
		},
		(err, stream) => {
			if (err) throw err
			stream.
				on('close', () => {
					conn.end()
					process.exit(1)
					}).
				on('data', data => {
					if (!gs) gs = stream
					if (gs._writableState.sync == false) process.stdout.write('' + data)
				}).
			stderr.
				on('data', data => { 
					d('STDERR: '.red + data)
					process.exit(1)
				})
			if(initialCommand) stream.stdin.write(initialCommand + "\r")

		})
	}).connect({
 		host: host.addr,
 		port: host.port,
 		username: host.user,
 		privateKey: fs.readFileSync(host.keyFile)
 	})
	let stdin = process.stdin
	stdin.setRawMode(true)
	stdin.resume()
	stdin.setEncoding( 'utf8' )
	stdin.on( 'data', key => { if (gs) gs.write('' + key) })
}

let buildPrompt = async (menu1, menu2) => {
	return await prompts([
		{
			suggest:suggestFnc,
			initial: 0,
			limit:process.stdout.rows - 3,
			instructions: false,
			type: 'autocomplete',
			name: 'host',
			message: 'Filter (regex supported)',
 		   choices: menu1
		},{
			suggest:suggestFnc,
			limit:process.stdout.rows - 3,
			instructions: false,
			type: 'autocomplete',
			name: 'action',
			message: 'What should i do next?',
			choices: menu2
		}])
}

let execOnRemote = async (host,execute) => {
	let conn = new SSH2()
	conn.on('ready', () => {
	conn.exec(execute.cmd, (err, stream) => {
		if (err) throw err
		stream.on('close', (code, signal) => {
			conn.end()
		}).on('data', data => {
			d((('<STDOUT time="' + new Date().toISOString() + '" host="' + host.title + '" command="' + execute.title + '">').green + '<![CDATA[\n' + data.toString('utf8').trim() + '\n]]>' + '</STDOUT>'.green))
		}).stderr.on('data', data => {
			d((('<STDERR time="' + new Date().toISOString() + '" host="' + host.title + '" command="' + execute.title + '">').red   + '<![CDATA[\n' + data.toString('utf8').trim() + '\n]]>' + '</STDERR>'.red))
		})
	})
	}).
	connect({
		host: host.addr,
		port: host.port,
		username: host.user,
		privateKey: fs.readFileSync(host.keyFile)
	})
}

(async () => {
	let hosts = []
	let stageTwoLongest = 0
	for(let i in stageTwo){
		stageTwo[i].value = i
		stageTwo[i].title = stageTwo[i].title
	}
	stageTwo.sort(sortByVal)
	
	let initialRemotes = await suggestFnc(initialRemotesFilter, hostsFull)
	let initialExecute = initialUdeFilter !=='' ? [{title:"U.D.E.",cmd:initialUdeFilter}] : await suggestFnc(initialExecuteFilter, stageTwo)

	if(initialRemotesFilter !== '' && ( initialUdeFilter !== '' ||  initialExecuteFilter !== '' )){
		for (let remote of initialRemotes){
			for(let execute of initialExecute){
				execOnRemote(remote,execute)
			}
		}
	}else{
		const bar1 = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic)
		bar1.start(initialRemotes.length, 0)
		let j = 0
		for(let i in initialRemotes){

			if(initialRemotes[i].cmd === null) initialRemotes[i].cmd = commandsAll

			hostsInfo(i,initialRemotes[i]).then(async h => {
				hosts.push(h)
				j++
				bar1.update(j)
				if(j === initialRemotes.length ){
					hosts.sort(sortByVal)
					bar1.stop()
					let response = await buildPrompt(hosts, stageTwo)
					if(typeof response.host === 'undefined' || typeof response.action === 'undefned')
						throw new Error("No selected host or action.")
					if(response.action) stageTwoLogin(hosts[response.host],stageTwo[response.action].cmd)
				}
			})
		}
	}
})()
