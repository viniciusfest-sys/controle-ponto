"use client"

import { useState, useEffect } from 'react'
import { Clock, Play, Pause, Square, Users, Calculator, FileText, Settings, Download, Calendar, Plus, Edit2, Trash2, Save, X, History, PenTool } from 'lucide-react'

interface Employee {
  id: string
  name: string
  workSchedule?: {
    workHoursPerDay: number
    workStartTime: string
    workEndTime: string
    workDays: string[] // ['monday', 'tuesday', etc.]
  }
}

interface TimeEntry {
  id: string
  employeeId: string
  employeeName: string
  date: string
  clockIn?: string
  clockOut?: string
  breaks: { start: string; end?: string }[]
  status: 'clocked-out' | 'clocked-in' | 'on-break'
  breakTime?: number // Tempo de intervalo manual para ponto retroativo
  signature?: string // Assinatura digital do funcionário
  signatureDate?: string // Data/hora da assinatura
}

interface WorkSettings {
  workHoursPerDay: number
  toleranceMinutes: number
  workStartTime: string
}

interface ReportPeriod {
  startDate: string
  endDate: string
  type: 'daily' | 'period' | 'monthly'
  selectedEmployeeId?: string // Nova propriedade para relatório individual
}

const DEFAULT_EMPLOYEES: Employee[] = [
  { id: '1', name: 'João Silva' },
  { id: '2', name: 'Maria Santos' },
  { id: '3', name: 'Pedro Costa' },
  { id: '4', name: 'Ana Oliveira' },
  { id: '5', name: 'Carlos Souza' }
]

const DEFAULT_SETTINGS: WorkSettings = {
  workHoursPerDay: 8,
  toleranceMinutes: 15,
  workStartTime: '08:00'
}

export default function ControlePonto() {
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [employees, setEmployees] = useState<Employee[]>(DEFAULT_EMPLOYEES)
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const [currentView, setCurrentView] = useState<'main' | 'reports' | 'settings' | 'employees' | 'retroactive' | 'signature'>('main')
  const [workSettings, setWorkSettings] = useState<WorkSettings>(DEFAULT_SETTINGS)
  const [reportPeriod, setReportPeriod] = useState<ReportPeriod>({
    startDate: '',
    endDate: '',
    type: 'daily'
  })
  
  // Estados para edição de funcionários
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [newEmployeeName, setNewEmployeeName] = useState('')
  const [showAddEmployee, setShowAddEmployee] = useState(false)

  // Estados para ponto retroativo
  const [retroactiveDate, setRetroactiveDate] = useState('')
  const [retroactiveClockIn, setRetroactiveClockIn] = useState('')
  const [retroactiveClockOut, setRetroactiveClockOut] = useState('')
  const [retroactiveEmployee, setRetroactiveEmployee] = useState<Employee | null>(null)
  const [retroactiveBreakTime, setRetroactiveBreakTime] = useState('')

  // Estados para assinatura
  const [showSignature, setShowSignature] = useState(false)
  const [signature, setSignature] = useState('')
  const [employeeToClockOut, setEmployeeToClockOut] = useState<Employee | null>(null)

  // Estados para edição de entradas no relatório
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null)
  const [editClockIn, setEditClockIn] = useState('')
  const [editClockOut, setEditClockOut] = useState('')
  const [editBreakTime, setEditBreakTime] = useState('')

  // Estado para controlar se o componente foi montado no cliente
  const [isMounted, setIsMounted] = useState(false)

  // Atualizar relógio a cada segundo
  useEffect(() => {
    // Marcar como montado no cliente
    setIsMounted(true)
    
    // Definir tempo inicial apenas no cliente
    setCurrentTime(new Date())
    
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Carregar dados do localStorage
  useEffect(() => {
    if (!isMounted) return // Só executar no cliente

    const savedEntries = localStorage.getItem('timeEntries')
    if (savedEntries) {
      setTimeEntries(JSON.parse(savedEntries))
    }

    const savedSettings = localStorage.getItem('workSettings')
    if (savedSettings) {
      setWorkSettings(JSON.parse(savedSettings))
    }

    const savedEmployees = localStorage.getItem('employees')
    if (savedEmployees) {
      setEmployees(JSON.parse(savedEmployees))
    }

    // Definir datas padrão para relatório - CORRIGIDO PARA 2025
    const today = new Date()
    const todayString = today.toISOString().split('T')[0]
    setReportPeriod(prev => ({
      ...prev,
      startDate: todayString,
      endDate: todayString
    }))
  }, [isMounted])

  // Salvar dados no localStorage
  useEffect(() => {
    if (!isMounted) return // Só executar no cliente
    localStorage.setItem('timeEntries', JSON.stringify(timeEntries))
  }, [timeEntries, isMounted])

  useEffect(() => {
    if (!isMounted) return // Só executar no cliente
    localStorage.setItem('workSettings', JSON.stringify(workSettings))
  }, [workSettings, isMounted])

  useEffect(() => {
    if (!isMounted) return // Só executar no cliente
    localStorage.setItem('employees', JSON.stringify(employees))
  }, [employees, isMounted])

  // FUNÇÕES DE DATA CORRIGIDAS PARA 2025
  const getCurrentDateString = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const getCurrentTimeString = () => {
    const now = new Date()
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    const seconds = String(now.getSeconds()).padStart(2, '0')
    return `${hours}:${minutes}:${seconds}`
  }

  const formatDateForDisplay = (dateString: string) => {
    // Criar data sem conversão de fuso horário
    const [year, month, day] = dateString.split('-')
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const formatDateTimeForDisplay = (date: Date) => {
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const getMonthName = (dateString: string) => {
    // Criar data sem conversão de fuso horário
    const [year, month, day] = dateString.split('-')
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
    return date.toLocaleDateString('pt-BR', { 
      month: 'long', 
      year: 'numeric' 
    })
  }

  const getFirstDayOfMonth = (year: number, month: number) => {
    const date = new Date(year, month - 1, 1)
    const yearStr = String(date.getFullYear())
    const monthStr = String(date.getMonth() + 1).padStart(2, '0')
    const dayStr = String(date.getDate()).padStart(2, '0')
    return `${yearStr}-${monthStr}-${dayStr}`
  }

  const getLastDayOfMonth = (year: number, month: number) => {
    const date = new Date(year, month, 0)
    const yearStr = String(date.getFullYear())
    const monthStr = String(date.getMonth() + 1).padStart(2, '0')
    const dayStr = String(date.getDate()).padStart(2, '0')
    return `${yearStr}-${monthStr}-${dayStr}`
  }

  const getTodayEntry = (employeeId: string) => {
    const today = getCurrentDateString()
    return timeEntries.find(entry => 
      entry.employeeId === employeeId && entry.date === today
    )
  }

  const getEntryByDate = (employeeId: string, date: string) => {
    return timeEntries.find(entry => 
      entry.employeeId === employeeId && entry.date === date
    )
  }

  const calculateLateness = (clockInTime: string, workStartTime: string) => {
    const [startHour, startMinute] = workStartTime.split(':').map(Number)
    const [clockHour, clockMinute] = clockInTime.split(':').map(Number)
    
    const startMinutes = startHour * 60 + startMinute
    const clockMinutes = clockHour * 60 + clockMinute
    
    const latenessMinutes = clockMinutes - startMinutes
    return Math.max(0, latenessMinutes)
  }

  // Funções para gerenciar funcionários
  const addEmployee = () => {
    if (newEmployeeName.trim()) {
      const newEmployee: Employee = {
        id: Date.now().toString(),
        name: newEmployeeName.trim()
      }
      setEmployees(prev => [...prev, newEmployee])
      setNewEmployeeName('')
      setShowAddEmployee(false)
    }
  }

  const updateEmployee = (employee: Employee) => {
    setEmployees(prev => prev.map(emp => 
      emp.id === employee.id ? employee : emp
    ))
    setEditingEmployee(null)
  }

  const deleteEmployee = (employeeId: string) => {
    setEmployees(prev => prev.filter(emp => emp.id !== employeeId))
    // Também remover entradas de tempo do funcionário
    setTimeEntries(prev => prev.filter(entry => entry.employeeId !== employeeId))
  }

  const updateEmployeeSchedule = (employeeId: string, schedule: Employee['workSchedule']) => {
    setEmployees(prev => prev.map(emp => 
      emp.id === employeeId ? { ...emp, workSchedule: schedule } : emp
    ))
  }

  // Função para excluir registro de ponto - MELHORADA
  const deleteTimeEntry = (entryId: string) => {
    const entry = timeEntries.find(e => e.id === entryId)
    if (!entry) return

    const confirmMessage = `Tem certeza que deseja excluir o registro de ponto de ${entry.employeeName} do dia ${formatDateForDisplay(entry.date)}?`
    
    if (confirm(confirmMessage)) {
      setTimeEntries(prev => prev.filter(entry => entry.id !== entryId))
      alert('Registro excluído com sucesso!')
    }
  }

  // Função para iniciar edição de entrada - MELHORADA
  const startEditEntry = (entry: TimeEntry) => {
    setEditingEntry(entry)
    setEditClockIn(entry.clockIn || '')
    setEditClockOut(entry.clockOut || '')
    setEditBreakTime(entry.breakTime ? entry.breakTime.toString() : '')
  }

  // Função para salvar edição de entrada - MELHORADA
  const saveEditEntry = () => {
    if (!editingEntry || !editClockIn) {
      alert('Por favor, preencha pelo menos o horário de entrada')
      return
    }

    // Validar formato de horário
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
    if (!timeRegex.test(editClockIn)) {
      alert('Formato de horário de entrada inválido. Use HH:MM')
      return
    }

    if (editClockOut && !timeRegex.test(editClockOut)) {
      alert('Formato de horário de saída inválido. Use HH:MM')
      return
    }

    // Validar se saída é posterior à entrada
    if (editClockOut) {
      const [inHour, inMinute] = editClockIn.split(':').map(Number)
      const [outHour, outMinute] = editClockOut.split(':').map(Number)
      const inMinutes = inHour * 60 + inMinute
      const outMinutes = outHour * 60 + outMinute
      
      if (outMinutes <= inMinutes) {
        alert('O horário de saída deve ser posterior ao horário de entrada')
        return
      }
    }

    setTimeEntries(prev => prev.map(entry => 
      entry.id === editingEntry.id 
        ? { 
            ...entry, 
            clockIn: editClockIn,
            clockOut: editClockOut || undefined,
            status: editClockOut ? 'clocked-out' : 'clocked-in',
            breakTime: editBreakTime ? parseFloat(editBreakTime) : undefined
          }
        : entry
    ))

    // Limpar estados de edição
    setEditingEntry(null)
    setEditClockIn('')
    setEditClockOut('')
    setEditBreakTime('')
    
    alert('Registro atualizado com sucesso!')
  }

  // Função para cancelar edição
  const cancelEditEntry = () => {
    setEditingEntry(null)
    setEditClockIn('')
    setEditClockOut('')
    setEditBreakTime('')
  }

  // Função para marcar ponto retroativo
  const addRetroactiveEntry = () => {
    if (!retroactiveEmployee || !retroactiveDate || !retroactiveClockIn) {
      alert('Por favor, preencha todos os campos obrigatórios')
      return
    }

    const existingEntry = getEntryByDate(retroactiveEmployee.id, retroactiveDate)
    
    if (existingEntry) {
      // Atualizar entrada existente
      setTimeEntries(prev => prev.map(entry => 
        entry.id === existingEntry.id 
          ? { 
              ...entry, 
              clockIn: retroactiveClockIn,
              clockOut: retroactiveClockOut || undefined,
              status: retroactiveClockOut ? 'clocked-out' : 'clocked-in',
              breakTime: retroactiveBreakTime ? parseFloat(retroactiveBreakTime) : undefined
            }
          : entry
      ))
    } else {
      // Criar nova entrada retroativa
      const newEntry: TimeEntry = {
        id: `${retroactiveEmployee.id}-${retroactiveDate}`,
        employeeId: retroactiveEmployee.id,
        employeeName: retroactiveEmployee.name,
        date: retroactiveDate,
        clockIn: retroactiveClockIn,
        clockOut: retroactiveClockOut || undefined,
        status: retroactiveClockOut ? 'clocked-out' : 'clocked-in',
        breaks: [],
        breakTime: retroactiveBreakTime ? parseFloat(retroactiveBreakTime) : undefined
      }
      setTimeEntries(prev => [...prev, newEntry])
    }

    // Limpar formulário
    setRetroactiveDate('')
    setRetroactiveClockIn('')
    setRetroactiveClockOut('')
    setRetroactiveEmployee(null)
    setRetroactiveBreakTime('')
    
    alert('Ponto retroativo registrado com sucesso!')
  }

  const clockIn = (employee: Employee) => {
    const today = getCurrentDateString()
    const currentTime = getCurrentTimeString()
    
    const existingEntry = getTodayEntry(employee.id)
    
    if (existingEntry) {
      // Atualizar entrada existente
      setTimeEntries(prev => prev.map(entry => 
        entry.id === existingEntry.id 
          ? { ...entry, clockIn: currentTime, status: 'clocked-in' }
          : entry
      ))
    } else {
      // Criar nova entrada
      const newEntry: TimeEntry = {
        id: `${employee.id}-${today}`,
        employeeId: employee.id,
        employeeName: employee.name,
        date: today,
        clockIn: currentTime,
        status: 'clocked-in',
        breaks: []
      }
      setTimeEntries(prev => [...prev, newEntry])
    }
  }

  const initiateClockOut = (employee: Employee) => {
    setEmployeeToClockOut(employee)
    setShowSignature(true)
    setCurrentView('signature')
  }

  const confirmClockOut = () => {
    if (!employeeToClockOut || !signature.trim()) {
      alert('Por favor, assine antes de confirmar a saída')
      return
    }

    const currentTime = getCurrentTimeString()
    const entry = getTodayEntry(employeeToClockOut.id)
    
    if (entry) {
      setTimeEntries(prev => prev.map(e => 
        e.id === entry.id 
          ? { 
              ...e, 
              clockOut: currentTime, 
              status: 'clocked-out',
              signature: signature,
              signatureDate: formatDateTimeForDisplay(new Date())
            }
          : e
      ))
    }

    // Limpar estados da assinatura
    setSignature('')
    setEmployeeToClockOut(null)
    setShowSignature(false)
    setCurrentView('main')
    
    alert('Saída registrada com sucesso!')
  }

  const cancelSignature = () => {
    setSignature('')
    setEmployeeToClockOut(null)
    setShowSignature(false)
    setCurrentView('main')
  }

  const startBreak = (employee: Employee) => {
    const currentTime = getCurrentTimeString()
    const entry = getTodayEntry(employee.id)
    
    if (entry) {
      setTimeEntries(prev => prev.map(e => 
        e.id === entry.id 
          ? { 
              ...e, 
              breaks: [...e.breaks, { start: currentTime }],
              status: 'on-break'
            }
          : e
      ))
    }
  }

  const endBreak = (employee: Employee) => {
    const currentTime = getCurrentTimeString()
    const entry = getTodayEntry(employee.id)
    
    if (entry) {
      setTimeEntries(prev => prev.map(e => 
        e.id === entry.id 
          ? { 
              ...e, 
              breaks: e.breaks.map((breakItem, index) => 
                index === e.breaks.length - 1 && !breakItem.end
                  ? { ...breakItem, end: currentTime }
                  : breakItem
              ),
              status: 'clocked-in'
            }
          : e
      ))
    }
  }

  const calculateHours = (entry: TimeEntry) => {
    if (!entry.clockIn) return { worked: 0, breaks: 0, overtime: 0, lateness: 0, discountedHours: 0 }

    const employee = employees.find(emp => emp.id === entry.employeeId)
    const employeeSettings = employee?.workSchedule || {
      workHoursPerDay: workSettings.workHoursPerDay,
      workStartTime: employee?.workSchedule?.workStartTime || workSettings.workStartTime
    }

    const clockInTime = new Date(`${entry.date}T${entry.clockIn}`)
    const clockOutTime = entry.clockOut 
      ? new Date(`${entry.date}T${entry.clockOut}`)
      : new Date()

    let totalWorkedMs = clockOutTime.getTime() - clockInTime.getTime()
    let totalBreakMs = 0

    // Usar tempo de intervalo manual se definido, senão calcular automaticamente
    if (entry.breakTime !== undefined) {
      totalBreakMs = entry.breakTime * 60 * 60 * 1000 // converter horas para ms
    } else {
      // Calcular tempo de pausas automaticamente
      entry.breaks.forEach(breakItem => {
        if (breakItem.end) {
          const breakStart = new Date(`${entry.date}T${breakItem.start}`)
          const breakEnd = new Date(`${entry.date}T${breakItem.end}`)
          totalBreakMs += breakEnd.getTime() - breakStart.getTime()
        } else if (entry.status === 'on-break') {
          // Pausa em andamento
          const breakStart = new Date(`${entry.date}T${breakItem.start}`)
          totalBreakMs += new Date().getTime() - breakStart.getTime()
        }
      })
    }

    // Calcular atraso usando o horário específico do funcionário
    const latenessMinutes = calculateLateness(entry.clockIn, employeeSettings.workStartTime)
    const latenessHours = latenessMinutes / 60

    // Calcular desconto por atraso (se exceder tolerância)
    const excessLateness = Math.max(0, latenessMinutes - workSettings.toleranceMinutes)
    const discountedHours = excessLateness / 60

    const workedMs = totalWorkedMs - totalBreakMs
    let workedHours = Math.max(0, workedMs / (1000 * 60 * 60))
    
    // Aplicar desconto por atraso
    workedHours = Math.max(0, workedHours - discountedHours)
    
    const breakHours = totalBreakMs / (1000 * 60 * 60)
    
    // Calcular horas extras automaticamente baseado na jornada
    const overtime = Math.max(0, workedHours - employeeSettings.workHoursPerDay)

    return {
      worked: workedHours,
      breaks: breakHours,
      overtime: overtime,
      lateness: latenessHours,
      discountedHours: discountedHours
    }
  }

  const formatHours = (hours: number) => {
    const h = Math.floor(hours)
    const m = Math.floor((hours - h) * 60)
    return `${h}h ${m.toString().padStart(2, '0')}m`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'clocked-in': return 'text-green-600 bg-green-50'
      case 'on-break': return 'text-yellow-600 bg-yellow-50'
      case 'clocked-out': return 'text-gray-600 bg-gray-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'clocked-in': return 'Trabalhando'
      case 'on-break': return 'Em Pausa'
      case 'clocked-out': return 'Saiu'
      default: return 'Não Registrado'
    }
  }

  const getEntriesForPeriod = () => {
    let filteredEntries = timeEntries

    // Filtrar por período
    if (reportPeriod.type === 'monthly') {
      const [year, month, day] = reportPeriod.startDate.split('-')
      const startYear = parseInt(year)
      const startMonth = parseInt(month) - 1 // JavaScript months are 0-indexed
      
      filteredEntries = filteredEntries.filter(entry => {
        const [entryYear, entryMonth, entryDay] = entry.date.split('-')
        const entryYearNum = parseInt(entryYear)
        const entryMonthNum = parseInt(entryMonth) - 1 // JavaScript months are 0-indexed
        return entryYearNum === startYear && entryMonthNum === startMonth
      })
    } else {
      filteredEntries = filteredEntries.filter(entry => 
        entry.date >= reportPeriod.startDate && entry.date <= reportPeriod.endDate
      )
    }

    // Filtrar por funcionário específico se selecionado
    if (reportPeriod.selectedEmployeeId) {
      filteredEntries = filteredEntries.filter(entry => 
        entry.employeeId === reportPeriod.selectedEmployeeId
      )
    }

    return filteredEntries
  }

  const generateReport = () => {
    const entriesForPeriod = getEntriesForPeriod()
    const selectedEmployee = reportPeriod.selectedEmployeeId 
      ? employees.find(emp => emp.id === reportPeriod.selectedEmployeeId)
      : null
    
    let reportContent = `RELATÓRIO DE PONTO`
    
    // Título do relatório
    if (selectedEmployee) {
      reportContent += ` - ${selectedEmployee.name.toUpperCase()}\n`
    } else {
      reportContent += ` - TODOS OS FUNCIONÁRIOS\n`
    }
    
    if (reportPeriod.type === 'monthly') {
      const monthName = getMonthName(reportPeriod.startDate)
      reportContent += `Período: ${monthName.toUpperCase()}\n`
    } else {
      reportContent += `Período: ${formatDateForDisplay(reportPeriod.startDate)} a ${formatDateForDisplay(reportPeriod.endDate)}\n`
    }
    
    reportContent += `Gerado em: ${formatDateTimeForDisplay(new Date())}\n\n`
    reportContent += `CONFIGURAÇÕES:\n`
    reportContent += `- Jornada de trabalho padrão: ${workSettings.workHoursPerDay}h\n`
    reportContent += `- Horário de entrada padrão: ${workSettings.workStartTime}\n`
    reportContent += `- Tolerância: ${workSettings.toleranceMinutes} minutos\n\n`
    
    if (selectedEmployee) {
      reportContent += `FUNCIONÁRIO:\n`
    } else {
      reportContent += `FUNCIONÁRIOS:\n`
    }
    reportContent += `${'='.repeat(60)}\n\n`

    // Determinar quais funcionários incluir no relatório
    const employeesToInclude = selectedEmployee ? [selectedEmployee] : employees

    employeesToInclude.forEach(employee => {
      const employeeEntries = entriesForPeriod.filter(e => e.employeeId === employee.id)
      reportContent += `${employee.name.toUpperCase()}\n`
      reportContent += `-`.repeat(30) + '\n'
      
      if (employee.workSchedule) {
        reportContent += `Escala personalizada: ${employee.workSchedule.workHoursPerDay}h (${employee.workSchedule.workStartTime} - ${employee.workSchedule.workEndTime})\n`
      }
      
      if (employeeEntries.length > 0) {
        let totalWorked = 0
        let totalOvertime = 0
        let totalLateness = 0
        
        employeeEntries.forEach(entry => {
          if (entry.clockIn) {
            const hours = calculateHours(entry)
            totalWorked += hours.worked
            totalOvertime += hours.overtime
            totalLateness += hours.lateness
            
            reportContent += `\n${formatDateForDisplay(entry.date)}:\n`
            reportContent += `  Entrada: ${entry.clockIn}\n`
            reportContent += `  Saída: ${entry.clockOut || 'Não registrada'}\n`
            
            if (entry.breaks.length > 0) {
              reportContent += `  Pausas:\n`
              entry.breaks.forEach((breakItem, index) => {
                reportContent += `    ${index + 1}. ${breakItem.start} - ${breakItem.end || 'Em andamento'}\n`
              })
            }
            
            if (entry.breakTime !== undefined && entry.breakTime > 0) {
              reportContent += `  Tempo de intervalo (manual): ${formatHours(entry.breakTime)}\n`
            }
            
            reportContent += `  Horas trabalhadas: ${formatHours(hours.worked)}\n`
            if (hours.overtime > 0) reportContent += `  Horas extras: ${formatHours(hours.overtime)}\n`
            if (hours.lateness > 0) reportContent += `  Atraso: ${formatHours(hours.lateness)}\n`
            if (hours.discountedHours > 0) reportContent += `  Desconto: ${formatHours(hours.discountedHours)}\n`
            
            if (entry.signature) {
              reportContent += `  Assinatura: ${entry.signature} (${entry.signatureDate})\n`
            }
          }
        })
        
        reportContent += `\nRESUMO DO PERÍODO:\n`
        reportContent += `- Total trabalhado: ${formatHours(totalWorked)}\n`
        reportContent += `- Total horas extras: ${formatHours(totalOvertime)}\n`
        reportContent += `- Total atrasos: ${formatHours(totalLateness)}\n`
      } else {
        reportContent += `Não registrou ponto neste período.\n`
      }
      
      reportContent += `\n`
    })

    // Criar arquivo para download
    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    
    let fileName = 'relatorio-ponto-'
    
    // Nome do arquivo baseado no funcionário selecionado
    if (selectedEmployee) {
      const employeeName = selectedEmployee.name.toLowerCase().replace(/\s+/g, '-')
      fileName += `${employeeName}-`
    } else {
      fileName += 'todos-funcionarios-'
    }
    
    if (reportPeriod.type === 'monthly') {
      const date = new Date(reportPeriod.startDate + 'T00:00:00')
      fileName += `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}.txt`
    } else {
      fileName += `${reportPeriod.startDate}-a-${reportPeriod.endDate}.txt`
    }
    
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Não renderizar nada até o componente estar montado no cliente
  if (!isMounted || !currentTime) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  // Tela de Assinatura
  if (currentView === 'signature') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-6 pt-6">
            <div className="flex items-center justify-center gap-3 mb-4">
              <PenTool className="w-6 h-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-800">Assinatura Digital</h1>
            </div>
            <p className="text-gray-600">
              {employeeToClockOut?.name}, confirme que está de acordo com o dia trabalhado
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Resumo do Dia</h2>
            
            {employeeToClockOut && (() => {
              const todayEntry = getTodayEntry(employeeToClockOut.id)
              const hours = todayEntry ? calculateHours(todayEntry) : null
              
              return (
                <div className="space-y-3">
                  {todayEntry && (
                    <>
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-700 font-medium">Entrada:</span>
                        <span className="font-mono text-gray-800">{todayEntry.clockIn}</span>
                      </div>
                      
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-700 font-medium">Saída:</span>
                        <span className="font-mono text-gray-800">{getCurrentTimeString()}</span>
                      </div>
                      
                      {hours && (
                        <>
                          <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                            <span className="text-blue-700 font-medium">Horas Trabalhadas:</span>
                            <span className="font-mono text-blue-800">{formatHours(hours.worked)}</span>
                          </div>
                          
                          <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                            <span className="text-yellow-700 font-medium">Pausas:</span>
                            <span className="font-mono text-yellow-800">{formatHours(hours.breaks)}</span>
                          </div>
                          
                          {hours.overtime > 0 && (
                            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                              <span className="text-green-700 font-medium">Horas Extras:</span>
                              <span className="font-mono text-green-800">{formatHours(hours.overtime)}</span>
                            </div>
                          )}
                        </>
                      )}
                    </>
                  )}
                </div>
              )
            })()}
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Assinatura Digital</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Digite seu nome completo para confirmar *
                </label>
                <input
                  type="text"
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                  placeholder="Digite seu nome completo"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Ao assinar, você confirma que está de acordo com as horas trabalhadas hoje
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={confirmClockOut}
                  disabled={!signature.trim()}
                  className="flex-1 flex items-center justify-center gap-2 p-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                >
                  <PenTool className="w-4 h-4" />
                  Confirmar e Registrar Saída
                </button>
                
                <button
                  onClick={cancelSignature}
                  className="flex items-center justify-center gap-2 p-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                >
                  <X className="w-4 h-4" />
                  Cancelar
                </button>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <div className="text-yellow-600 mt-0.5">⚠️</div>
              <div className="text-yellow-800 text-sm">
                <strong>Importante:</strong> Sua assinatura digital será registrada junto com o horário de saída e não poderá ser alterada posteriormente.
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Tela de Ponto Retroativo
  if (currentView === 'retroactive') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-6 pt-6">
            <button
              onClick={() => setCurrentView('main')}
              className="text-blue-600 hover:text-blue-800 mb-4 font-medium"
            >
              ← Voltar
            </button>
            <div className="flex items-center justify-center gap-3 mb-4">
              <History className="w-6 h-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-800">Marcar Ponto Retroativo</h1>
            </div>
            <p className="text-gray-600 text-sm">
              Registre pontos de dias anteriores que foram perdidos
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Registrar Ponto Anterior</h2>
            
            <div className="space-y-4">
              {/* Seleção de Funcionário */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Funcionário *
                </label>
                <select
                  value={retroactiveEmployee?.id || ''}
                  onChange={(e) => {
                    const employee = employees.find(emp => emp.id === e.target.value)
                    setRetroactiveEmployee(employee || null)
                  }}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Selecione um funcionário</option>
                  {employees.map(employee => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Data */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data *
                </label>
                <input
                  type="date"
                  value={retroactiveDate}
                  onChange={(e) => setRetroactiveDate(e.target.value)}
                  max={getCurrentDateString()}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Horário de Entrada */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Horário de Entrada *
                </label>
                <input
                  type="time"
                  value={retroactiveClockIn}
                  onChange={(e) => setRetroactiveClockIn(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Horário de Saída */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Horário de Saída (opcional)
                </label>
                <input
                  type="time"
                  value={retroactiveClockOut}
                  onChange={(e) => setRetroactiveClockOut(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Deixe em branco se o funcionário ainda não saiu
                </p>
              </div>

              {/* Tempo de Intervalo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tempo de Intervalo (opcional)
                </label>
                <input
                  type="number"
                  min="0"
                  max="12"
                  step="0.5"
                  value={retroactiveBreakTime}
                  onChange={(e) => setRetroactiveBreakTime(e.target.value)}
                  placeholder="Ex: 1.5"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Informe o tempo total de intervalo em horas (se houver)
                </p>
              </div>

              {/* Verificar se já existe entrada para esta data */}
              {retroactiveEmployee && retroactiveDate && (
                <div className="p-3 bg-yellow-50 rounded-lg">
                  {getEntryByDate(retroactiveEmployee.id, retroactiveDate) ? (
                    <div className="text-yellow-800 text-sm">
                      ⚠️ Já existe um registro para este funcionário nesta data. 
                      Ao salvar, os dados serão atualizados.
                    </div>
                  ) : (
                    <div className="text-green-800 text-sm">
                      ✅ Nenhum registro encontrado para esta data. 
                      Um novo registro será criado.
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={addRetroactiveEntry}
                disabled={!retroactiveEmployee || !retroactiveDate || !retroactiveClockIn}
                className="w-full flex items-center justify-center gap-2 p-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
              >
                <Save className="w-4 h-4" />
                Registrar Ponto Retroativo
              </button>
            </div>
          </div>

          {/* Histórico de Registros Recentes */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Registros Recentes</h2>
            
            <div className="space-y-3">
              {timeEntries
                .filter(entry => entry.date !== getCurrentDateString())
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .slice(0, 5)
                .map(entry => {
                  const employee = employees.find(emp => emp.id === entry.employeeId)
                  return (
                    <div key={entry.id} className="p-3 border border-gray-200 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-medium text-gray-800">{employee?.name}</div>
                          <div className="text-sm text-gray-600">
                            {formatDateForDisplay(entry.date)}
                          </div>
                          <div className="text-sm text-gray-600">
                            {entry.clockIn} - {entry.clockOut || 'Em aberto'}
                          </div>
                          {entry.breakTime && entry.breakTime > 0 && (
                            <div className="text-sm text-blue-600">
                              Tempo de intervalo: {formatHours(entry.breakTime)}
                            </div>
                          )}
                          {entry.signature && (
                            <div className="text-sm text-green-600">
                              ✓ Assinado: {entry.signature}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(entry.status)}`}>
                            {getStatusText(entry.status)}
                          </span>
                          <button
                            onClick={() => deleteTimeEntry(entry.id)}
                            className="flex items-center gap-1 px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-xs font-medium transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                            Excluir
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              
              {timeEntries.filter(entry => entry.date !== getCurrentDateString()).length === 0 && (
                <div className="text-center text-gray-500 py-4">
                  Nenhum registro anterior encontrado
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Tela de Gerenciamento de Funcionários
  if (currentView === 'employees') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-6 pt-6">
            <button
              onClick={() => setCurrentView('main')}
              className="text-blue-600 hover:text-blue-800 mb-4 font-medium"
            >
              ← Voltar
            </button>
            <div className="flex items-center justify-center gap-3 mb-4">
              <Users className="w-6 h-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-800">Gerenciar Funcionários</h1>
            </div>
          </div>

          {/* Adicionar Funcionário */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Adicionar Funcionário</h2>
              <button
                onClick={() => setShowAddEmployee(!showAddEmployee)}
                className="flex items-center gap-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                Novo
              </button>
            </div>
            
            {showAddEmployee && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newEmployeeName}
                  onChange={(e) => setNewEmployeeName(e.target.value)}
                  placeholder="Nome do funcionário"
                  className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyPress={(e) => e.key === 'Enter' && addEmployee()}
                />
                <button
                  onClick={addEmployee}
                  className="flex items-center gap-2 px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
                >
                  <Save className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setShowAddEmployee(false)
                    setNewEmployeeName('')
                  }}
                  className="flex items-center gap-2 px-4 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Lista de Funcionários */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Funcionários Cadastrados</h2>
            
            <div className="space-y-3">
              {employees.map(employee => (
                <div key={employee.id} className="p-4 border border-gray-200 rounded-lg">
                  {editingEmployee?.id === employee.id ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={editingEmployee.name}
                        onChange={(e) => setEditingEmployee({...editingEmployee, name: e.target.value})}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      
                      {/* Configuração de Escala */}
                      <div className="space-y-2">
                        <h4 className="font-medium text-gray-700">Horário de Entrada Personalizado</h4>
                        <input
                          type="time"
                          placeholder="Horário de entrada"
                          value={editingEmployee.workSchedule?.workStartTime || ''}
                          onChange={(e) => setEditingEmployee({
                            ...editingEmployee,
                            workSchedule: {
                              ...editingEmployee.workSchedule,
                              workHoursPerDay: editingEmployee.workSchedule?.workHoursPerDay || workSettings.workHoursPerDay,
                              workStartTime: e.target.value,
                              workEndTime: editingEmployee.workSchedule?.workEndTime || '17:00',
                              workDays: editingEmployee.workSchedule?.workDays || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
                            }
                          })}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        
                        <h4 className="font-medium text-gray-700">Jornada de Trabalho Personalizada</h4>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="number"
                            min="1"
                            max="12"
                            step="0.5"
                            placeholder="Horas/dia"
                            value={editingEmployee.workSchedule?.workHoursPerDay || ''}
                            onChange={(e) => setEditingEmployee({
                              ...editingEmployee,
                              workSchedule: {
                                ...editingEmployee.workSchedule,
                                workHoursPerDay: parseFloat(e.target.value) || workSettings.workHoursPerDay,
                                workStartTime: editingEmployee.workSchedule?.workStartTime || workSettings.workStartTime,
                                workEndTime: editingEmployee.workSchedule?.workEndTime || '17:00',
                                workDays: editingEmployee.workSchedule?.workDays || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
                              }
                            })}
                            className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <input
                            type="time"
                            placeholder="Saída"
                            value={editingEmployee.workSchedule?.workEndTime || ''}
                            onChange={(e) => setEditingEmployee({
                              ...editingEmployee,
                              workSchedule: {
                                ...editingEmployee.workSchedule,
                                workHoursPerDay: editingEmployee.workSchedule?.workHoursPerDay || workSettings.workHoursPerDay,
                                workStartTime: editingEmployee.workSchedule?.workStartTime || workSettings.workStartTime,
                                workEndTime: e.target.value,
                                workDays: editingEmployee.workSchedule?.workDays || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
                              }
                            })}
                            className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <p className="text-sm text-gray-500">
                          Deixe em branco para usar as configurações padrão do sistema
                        </p>
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateEmployee(editingEmployee)}
                          className="flex items-center gap-2 px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
                        >
                          <Save className="w-4 h-4" />
                          Salvar
                        </button>
                        <button
                          onClick={() => setEditingEmployee(null)}
                          className="flex items-center gap-2 px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                        >
                          <X className="w-4 h-4" />
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-800">{employee.name}</div>
                        {employee.workSchedule && (
                          <div className="text-sm text-gray-600">
                            Entrada: {employee.workSchedule.workStartTime} | Jornada: {employee.workSchedule.workHoursPerDay}h | Saída: {employee.workSchedule.workEndTime}
                          </div>
                        )}
                        {!employee.workSchedule && (
                          <div className="text-sm text-gray-500">
                            Usando configurações padrão (Entrada: {workSettings.workStartTime} | Jornada: {workSettings.workHoursPerDay}h)
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingEmployee(employee)}
                          className="flex items-center gap-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteEmployee(employee.id)}
                          className="flex items-center gap-2 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Tela de Configurações
  if (currentView === 'settings') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-6 pt-6">
            <button
              onClick={() => setCurrentView('main')}
              className="text-blue-600 hover:text-blue-800 mb-4 font-medium"
            >
              ← Voltar
            </button>
            <div className="flex items-center justify-center gap-3 mb-4">
              <Settings className="w-6 h-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-800">Configurações</h1>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jornada de Trabalho Padrão (horas por dia)
                </label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  step="0.5"
                  value={workSettings.workHoursPerDay}
                  onChange={(e) => setWorkSettings(prev => ({
                    ...prev,
                    workHoursPerDay: parseFloat(e.target.value) || 8
                  }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Esta configuração será usada para funcionários sem escala personalizada
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Horário de Entrada Padrão
                </label>
                <input
                  type="time"
                  value={workSettings.workStartTime}
                  onChange={(e) => setWorkSettings(prev => ({
                    ...prev,
                    workStartTime: e.target.value
                  }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Funcionários com horário personalizado usarão seu próprio horário
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tolerância de Atraso (minutos)
                </label>
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={workSettings.toleranceMinutes}
                  onChange={(e) => setWorkSettings(prev => ({
                    ...prev,
                    toleranceMinutes: parseInt(e.target.value) || 0
                  }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Atrasos acima deste tempo serão descontados das horas trabalhadas
                </p>
              </div>

              <div className="pt-4 border-t">
                <h3 className="font-medium text-gray-800 mb-3">Configurações Atuais:</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <div>• Jornada padrão: {workSettings.workHoursPerDay}h por dia</div>
                  <div>• Entrada padrão: {workSettings.workStartTime}</div>
                  <div>• Tolerância: {workSettings.toleranceMinutes} minutos</div>
                  <div className="mt-2 text-xs text-gray-500">
                    * Funcionários podem ter horários personalizados que substituem as configurações padrão
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Tela de Relatórios
  if (currentView === 'reports') {
    const entriesForPeriod = getEntriesForPeriod()
    const selectedEmployeeForReport = reportPeriod.selectedEmployeeId 
      ? employees.find(emp => emp.id === reportPeriod.selectedEmployeeId)
      : null
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-6 pt-6">
            <button
              onClick={() => setCurrentView('main')}
              className="text-blue-600 hover:text-blue-800 mb-4 font-medium"
            >
              ← Voltar
            </button>
            <div className="flex items-center justify-center gap-3 mb-4">
              <FileText className="w-6 h-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-800">Relatórios</h1>
            </div>
          </div>

          {/* Configuração do Período */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-800">Configurar Relatório</h2>
            </div>
            
            <div className="space-y-4">
              {/* Seleção de Funcionário */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Funcionário
                </label>
                <select
                  value={reportPeriod.selectedEmployeeId || ''}
                  onChange={(e) => setReportPeriod(prev => ({
                    ...prev,
                    selectedEmployeeId: e.target.value || undefined
                  }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Todos os funcionários</option>
                  {employees.map(employee => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name}
                    </option>
                  ))}
                </select>
                <p className="text-sm text-gray-500 mt-1">
                  Selecione um funcionário específico ou deixe em branco para incluir todos
                </p>
              </div>

              {/* Tipo de Relatório */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Relatório
                </label>
                <select
                  value={reportPeriod.type}
                  onChange={(e) => {
                    const type = e.target.value as 'daily' | 'period' | 'monthly'
                    if (type === 'monthly') {
                      const today = new Date()
                      const year = today.getFullYear()
                      const month = today.getMonth() + 1
                      const firstDay = getFirstDayOfMonth(year, month)
                      const lastDay = getLastDayOfMonth(year, month)
                      setReportPeriod(prev => ({
                        ...prev,
                        type,
                        startDate: firstDay,
                        endDate: lastDay
                      }))
                    } else {
                      setReportPeriod(prev => ({ ...prev, type }))
                    }
                  }}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="daily">Diário</option>
                  <option value="period">Período Personalizado</option>
                  <option value="monthly">Mensal</option>
                </select>
              </div>

              {/* Seleção de Datas */}
              {reportPeriod.type === 'daily' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data
                  </label>
                  <input
                    type="date"
                    value={reportPeriod.startDate}
                    onChange={(e) => setReportPeriod(prev => ({
                      ...prev,
                      startDate: e.target.value,
                      endDate: e.target.value
                    }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}

              {reportPeriod.type === 'period' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Data Inicial
                    </label>
                    <input
                      type="date"
                      value={reportPeriod.startDate}
                      onChange={(e) => setReportPeriod(prev => ({
                        ...prev,
                        startDate: e.target.value
                      }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Data Final
                    </label>
                    <input
                      type="date"
                      value={reportPeriod.endDate}
                      onChange={(e) => setReportPeriod(prev => ({
                        ...prev,
                        endDate: e.target.value
                      }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}

              {reportPeriod.type === 'monthly' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mês/Ano
                  </label>
                  <input
                    type="month"
                    value={reportPeriod.startDate.substring(0, 7)}
                    onChange={(e) => {
                      const [year, month] = e.target.value.split('-')
                      const yearNum = parseInt(year)
                      const monthNum = parseInt(month)
                      const firstDay = getFirstDayOfMonth(yearNum, monthNum)
                      const lastDay = getLastDayOfMonth(yearNum, monthNum)
                      setReportPeriod(prev => ({
                        ...prev,
                        startDate: firstDay,
                        endDate: lastDay
                      }))
                    }}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}

              <button
                onClick={generateReport}
                className="w-full flex items-center justify-center gap-2 p-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
              >
                <Download className="w-4 h-4" />
                Baixar Relatório {selectedEmployeeForReport ? `- ${selectedEmployeeForReport.name}` : '- Todos'}
              </button>
            </div>
          </div>

          {/* Visualização do Relatório */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Visualização {selectedEmployeeForReport ? `- ${selectedEmployeeForReport.name}` : '- Todos os Funcionários'}
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              {reportPeriod.type === 'monthly' 
                ? getMonthName(reportPeriod.startDate)
                : reportPeriod.startDate === reportPeriod.endDate 
                  ? formatDateForDisplay(reportPeriod.startDate)
                  : `${formatDateForDisplay(reportPeriod.startDate)} a ${formatDateForDisplay(reportPeriod.endDate)}`
              }
            </p>
            
            <div className="space-y-4">
              {(selectedEmployeeForReport ? [selectedEmployeeForReport] : employees).map(employee => {
                const employeeEntries = entriesForPeriod.filter(e => e.employeeId === employee.id)
                
                return (
                  <div key={employee.id} className="p-4 border border-gray-200 rounded-lg">
                    <h3 className="font-medium text-gray-800 mb-3">{employee.name}</h3>
                    
                    {employeeEntries.length > 0 ? (
                      <div className="space-y-3">
                        {employeeEntries.map(entry => {
                          const hours = calculateHours(entry)
                          return (
                            <div key={entry.id} className="border border-gray-100 rounded-lg p-3">
                              {/* Verificar se está editando esta entrada */}
                              {editingEntry?.id === entry.id ? (
                                <div className="space-y-3">
                                  <div className="font-medium text-gray-700 mb-2 flex items-center justify-between">
                                    <span>Editando: {formatDateForDisplay(entry.date)}</span>
                                    <div className="text-xs text-gray-500">
                                      ID: {entry.id}
                                    </div>
                                  </div>
                                  
                                  <div className="grid grid-cols-2 gap-3">
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Entrada *
                                      </label>
                                      <input
                                        type="time"
                                        value={editClockIn}
                                        onChange={(e) => setEditClockIn(e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Saída
                                      </label>
                                      <input
                                        type="time"
                                        value={editClockOut}
                                        onChange={(e) => setEditClockOut(e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                      />
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      Tempo de Intervalo (horas)
                                    </label>
                                    <input
                                      type="number"
                                      min="0"
                                      max="12"
                                      step="0.5"
                                      value={editBreakTime}
                                      onChange={(e) => setEditBreakTime(e.target.value)}
                                      placeholder="Ex: 1.5"
                                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                  </div>
                                  
                                  <div className="flex gap-2">
                                    <button
                                      onClick={saveEditEntry}
                                      className="flex items-center gap-1 px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors"
                                    >
                                      <Save className="w-3 h-3" />
                                      Salvar
                                    </button>
                                    <button
                                      onClick={cancelEditEntry}
                                      className="flex items-center gap-1 px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors"
                                    >
                                      <X className="w-3 h-3" />
                                      Cancelar
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  <div className="flex justify-between items-start mb-2">
                                    <div className="font-medium text-gray-700">
                                      {formatDateForDisplay(entry.date)}
                                    </div>
                                    <div className="flex gap-1">
                                      <button
                                        onClick={() => startEditEntry(entry)}
                                        className="flex items-center gap-1 px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs font-medium transition-colors"
                                        title="Editar registro"
                                      >
                                        <Edit2 className="w-3 h-3" />
                                        Editar
                                      </button>
                                      <button
                                        onClick={() => deleteTimeEntry(entry.id)}
                                        className="flex items-center gap-1 px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-xs font-medium transition-colors"
                                        title="Excluir registro"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                        Excluir
                                      </button>
                                    </div>
                                  </div>
                                  
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <span className="text-gray-600">Entrada:</span> {entry.clockIn || 'N/A'}
                                    </div>
                                    <div>
                                      <span className="text-gray-600">Saída:</span> {entry.clockOut || 'N/A'}
                                    </div>
                                    <div>
                                      <span className="text-gray-600">Trabalhadas:</span> 
                                      <span className="text-blue-600 font-medium"> {formatHours(hours.worked)}</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-600">Extras:</span> 
                                      <span className="text-green-600 font-medium"> {formatHours(hours.overtime)}</span>
                                    </div>
                                  </div>
                                  
                                  {entry.breakTime && entry.breakTime > 0 && (
                                    <div className="text-sm text-blue-600 mt-1">
                                      Tempo de intervalo: {formatHours(entry.breakTime)}
                                    </div>
                                  )}
                                  
                                  {entry.signature && (
                                    <div className="text-sm text-green-600 mt-1">
                                      ✓ Assinado: {entry.signature}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="text-gray-500 text-sm">Não registrou ponto neste período</div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Tela Principal
  if (!selectedEmployee) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="text-center mb-8 pt-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Clock className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-800">Controle de Ponto</h1>
            </div>
            <div className="text-lg font-mono text-gray-600 bg-white rounded-lg p-3 shadow-sm">
              {formatDateTimeForDisplay(currentTime)}
            </div>
          </div>

          {/* Menu de Navegação */}
          <div className="grid grid-cols-2 gap-2 mb-6">
            <button
              onClick={() => setCurrentView('employees')}
              className="flex items-center justify-center gap-2 p-3 bg-white hover:bg-blue-50 rounded-xl shadow-sm border-2 border-transparent hover:border-blue-200 transition-colors"
            >
              <Users className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-gray-800">Funcionários</span>
            </button>
            <button
              onClick={() => setCurrentView('reports')}
              className="flex items-center justify-center gap-2 p-3 bg-white hover:bg-blue-50 rounded-xl shadow-sm border-2 border-transparent hover:border-blue-200 transition-colors"
            >
              <FileText className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-gray-800">Relatórios</span>
            </button>
            <button
              onClick={() => setCurrentView('retroactive')}
              className="flex items-center justify-center gap-2 p-3 bg-white hover:bg-blue-50 rounded-xl shadow-sm border-2 border-transparent hover:border-blue-200 transition-colors"
            >
              <History className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-gray-800">Ponto Retroativo</span>
            </button>
            <button
              onClick={() => setCurrentView('settings')}
              className="flex items-center justify-center gap-2 p-3 bg-white hover:bg-blue-50 rounded-xl shadow-sm border-2 border-transparent hover:border-blue-200 transition-colors"
            >
              <Settings className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-gray-800">Configurações</span>
            </button>
          </div>

          {/* Seleção de Funcionário */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-800">Selecione seu nome</h2>
            </div>
            
            <div className="space-y-3">
              {employees.map(employee => {
                const todayEntry = getTodayEntry(employee.id)
                const status = todayEntry?.status || 'clocked-out'
                
                return (
                  <button
                    key={employee.id}
                    onClick={() => setSelectedEmployee(employee)}
                    className="w-full p-4 text-left bg-gray-50 hover:bg-blue-50 rounded-xl transition-colors border-2 border-transparent hover:border-blue-200"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium text-gray-800">{employee.name}</span>
                        {employee.workSchedule && (
                          <div className="text-sm text-gray-600">
                            Entrada: {employee.workSchedule.workStartTime} | {employee.workSchedule.workHoursPerDay}h | Saída: {employee.workSchedule.workEndTime}
                          </div>
                        )}
                        {!employee.workSchedule && (
                          <div className="text-sm text-gray-500">
                            Padrão: {workSettings.workStartTime} | {workSettings.workHoursPerDay}h
                          </div>
                        )}
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(status)}`}>
                        {getStatusText(status)}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Resumo do Dia */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Calculator className="w-5 h-5 text-green-600" />
              <h2 className="text-xl font-semibold text-gray-800">Resumo de Hoje</h2>
            </div>
            
            <div className="space-y-3">
              {employees.map(employee => {
                const todayEntry = getTodayEntry(employee.id)
                if (!todayEntry || !todayEntry.clockIn) return null
                
                const hours = calculateHours(todayEntry)
                
                return (
                  <div key={employee.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="font-medium text-gray-800 mb-2">{employee.name}</div>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <span className="text-gray-600">Trabalhadas:</span>
                        <div className="font-medium text-blue-600">{formatHours(hours.worked)}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Pausas:</span>
                        <div className="font-medium text-yellow-600">{formatHours(hours.breaks)}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Extras:</span>
                        <div className="font-medium text-green-600">{formatHours(hours.overtime)}</div>
                      </div>
                    </div>
                    {hours.discountedHours > 0 && (
                      <div className="mt-2 text-sm">
                        <span className="text-red-600">Desconto por atraso: {formatHours(hours.discountedHours)}</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const todayEntry = getTodayEntry(selectedEmployee.id)
  const currentStatus = todayEntry?.status || 'clocked-out'
  const hours = todayEntry ? calculateHours(todayEntry) : { worked: 0, breaks: 0, overtime: 0, lateness: 0, discountedHours: 0 }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-6 pt-6">
          <button
            onClick={() => setSelectedEmployee(null)}
            className="text-blue-600 hover:text-blue-800 mb-4 font-medium"
          >
            ← Voltar para seleção
          </button>
          
          <h1 className="text-2xl font-bold text-gray-800 mb-2">{selectedEmployee.name}</h1>
          {selectedEmployee.workSchedule && (
            <div className="text-sm text-gray-600 mb-2">
              Entrada: {selectedEmployee.workSchedule.workStartTime} | Jornada: {selectedEmployee.workSchedule.workHoursPerDay}h | Saída: {selectedEmployee.workSchedule.workEndTime}
            </div>
          )}
          {!selectedEmployee.workSchedule && (
            <div className="text-sm text-gray-500 mb-2">
              Usando configurações padrão (Entrada: {workSettings.workStartTime} | Jornada: {workSettings.workHoursPerDay}h)
            </div>
          )}
          <div className="text-lg font-mono text-gray-600 bg-white rounded-lg p-3 shadow-sm mb-4">
            {formatDateTimeForDisplay(currentTime)}
          </div>
          
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-medium ${getStatusColor(currentStatus)}`}>
            <div className="w-2 h-2 rounded-full bg-current"></div>
            {getStatusText(currentStatus)}
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Marcar Ponto</h2>
          
          <div className="grid grid-cols-2 gap-3">
            {currentStatus === 'clocked-out' && (
              <button
                onClick={() => clockIn(selectedEmployee)}
                className="flex items-center justify-center gap-2 p-4 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium transition-colors"
              >
                <Play className="w-5 h-5" />
                Entrada
              </button>
            )}
            
            {currentStatus === 'clocked-in' && (
              <>
                <button
                  onClick={() => startBreak(selectedEmployee)}
                  className="flex items-center justify-center gap-2 p-4 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl font-medium transition-colors"
                >
                  <Pause className="w-5 h-5" />
                  Pausar
                </button>
                <button
                  onClick={() => initiateClockOut(selectedEmployee)}
                  className="flex items-center justify-center gap-2 p-4 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors"
                >
                  <Square className="w-5 h-5" />
                  Saída
                </button>
              </>
            )}
            
            {currentStatus === 'on-break' && (
              <button
                onClick={() => endBreak(selectedEmployee)}
                className="flex items-center justify-center gap-2 p-4 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors col-span-2"
              >
                <Play className="w-5 h-5" />
                Voltar do Intervalo
              </button>
            )}
          </div>
        </div>

        {/* Horários de Hoje */}
        {todayEntry && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Horários de Hoje</h2>
            
            <div className="space-y-3">
              {todayEntry.clockIn && (
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="text-green-700 font-medium">Entrada</span>
                  <span className="font-mono text-green-800">{todayEntry.clockIn}</span>
                </div>
              )}
              
              {todayEntry.breaks.map((breakItem, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                    <span className="text-yellow-700 font-medium">Pausa {index + 1} - Início</span>
                    <span className="font-mono text-yellow-800">{breakItem.start}</span>
                  </div>
                  {breakItem.end && (
                    <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                      <span className="text-yellow-700 font-medium">Pausa {index + 1} - Fim</span>
                      <span className="font-mono text-yellow-800">{breakItem.end}</span>
                    </div>
                  )}
                </div>
              ))}
              
              {todayEntry.clockOut && (
                <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                  <span className="text-red-700 font-medium">Saída</span>
                  <span className="font-mono text-red-800">{todayEntry.clockOut}</span>
                </div>
              )}

              {todayEntry.signature && (
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <span className="text-blue-700 font-medium">Assinatura</span>
                  <span className="font-mono text-blue-800">✓ {todayEntry.signature}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Cálculo de Horas */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Cálculo de Horas</h2>
          
          <div className="grid grid-cols-1 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-blue-700 font-medium mb-1">Horas Trabalhadas</div>
              <div className="text-2xl font-bold text-blue-800">{formatHours(hours.worked)}</div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-yellow-50 rounded-lg">
                <div className="text-yellow-700 font-medium mb-1">Pausas</div>
                <div className="text-xl font-bold text-yellow-800">{formatHours(hours.breaks)}</div>
              </div>
              
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="text-green-700 font-medium mb-1">Horas Extras</div>
                <div className="text-xl font-bold text-green-800">{formatHours(hours.overtime)}</div>
              </div>
            </div>

            {(hours.lateness > 0 || hours.discountedHours > 0) && (
              <div className="grid grid-cols-2 gap-4">
                {hours.lateness > 0 && (
                  <div className="p-4 bg-red-50 rounded-lg">
                    <div className="text-red-700 font-medium mb-1">Atraso</div>
                    <div className="text-xl font-bold text-red-800">{formatHours(hours.lateness)}</div>
                  </div>
                )}
                
                {hours.discountedHours > 0 && (
                  <div className="p-4 bg-red-50 rounded-lg">
                    <div className="text-red-700 font-medium mb-1">Desconto</div>
                    <div className="text-xl font-bold text-red-800">{formatHours(hours.discountedHours)}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}