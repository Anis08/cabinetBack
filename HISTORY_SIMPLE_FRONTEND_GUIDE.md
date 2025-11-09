# HistorySimple Component - Frontend Integration Guide

## Overview

This guide explains how to make the HistorySimple component work with the backend API endpoints.

## API Endpoints to Use

### Option 1: Grouped Endpoint (Recommended)
```javascript
GET /medecin/completed-appointments-grouped
```

Response format:
```json
{
  "completedApointments": {
    "2025-11-09": [ /* array of appointments */ ],
    "2025-11-08": [ /* array of appointments */ ]
  },
  "todayRevenue": 1200,
  "weekRevenue": 8500,
  "averagePaid": 150
}
```

### Option 2: Original Endpoint
```javascript
GET /medecin/completed-appointments
```

Response format:
```json
{
  "completedApointments": [ /* flat array */ ],
  "todayRevenue": 1200,
  "weekRevenue": 8500,
  "averagePaid": 150
}
```

## Data Transformation Required

The component expects this structure:
```javascript
{
  id: 1,
  date: "2025-11-09",  // YYYY-MM-DD format
  startTime: "2025-11-09T09:00:00Z",
  endTime: "2025-11-09T09:30:00Z",
  patient: {
    id: 1,
    fullName: "Marie Dupont",
    maladieChronique: "Hypertension"
  },
  motif: "Consultation",
  statut: "termine",
  clinicalSummary: "Patient notes...",
  vitalSigns: {
    bloodPressureSystolic: 145,
    bloodPressureDiastolic: 92,
    heartRate: 82,
    temperature: 36.8,
    weight: 68,
    height: 165,
    bmi: 25.0,
    oxygenSaturation: 98,
    respiratoryRate: 16
  },
  biologicalTests: [
    {
      test: "CRP",
      status: "demandée",  // or "en attente" or "reçue"
      date: "2025-11-09T00:00:00Z",
      result: null
    }
  ],
  documents: []
}
```

The backend returns:
```javascript
{
  id: 1,
  date: "2025-11-09T00:00:00.000Z",
  startTime: "2025-11-09T09:00:00.000Z",
  endTime: "2025-11-09T09:30:00.000Z",
  state: "Completed",
  patientId: 456,
  patient: {
    id: 456,
    fullName: "Marie Dupont",
    maladieChronique: "Hypertension"
  },
  motif: "Consultation",
  statut: "termine",
  clinicalSummary: "Patient notes...",
  vitalSigns: {
    bloodPressureSystolic: 145,
    bloodPressureDiastolic: 92,
    heartRate: 82,
    weight: 68,
    height: 165,
    bmi: 25.0,
    pcm: 36.8
  },
  biologicalTests: [
    {
      test: "CRP",
      status: "en attente",
      date: "2025-11-09T10:00:00.000Z",
      result: null
    }
  ],
  documents: []
}
```

## Key Differences

1. **Date format**: Backend uses full ISO string, component expects YYYY-MM-DD for filtering
2. **Vital signs naming**: Backend uses exact database field names
3. **Biological tests**: Backend status values already translated to French

## Updated Component Code

Replace the `loadHistoryData` function with:

```javascript
const loadHistoryData = async () => {
  setLoading(true)
  try {
    let response = await fetch(`${baseURL}/medecin/completed-appointments-grouped`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      credentials: 'include',
    })

    if (!response.ok) {
      if (response.status === 403) {
        logout()
        return
      }
      if (response.status === 401) {
        const refreshResponse = await refresh()
        if (!refreshResponse) {
          logout()
          return
        }

        response = await fetch(`${baseURL}/medecin/completed-appointments-grouped`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          credentials: 'include',
        })
      }

      if (!response.ok) {
        console.log('API error, using empty state')
        setCompletedAppointments({})
        setLoading(false)
        return
      }
    }

    const data = await response.json()
    
    // Data is already grouped by date in YYYY-MM-DD format
    const groupedAppointments = data.completedApointments || {}
    
    // Convert to array format expected by component
    // Flatten the grouped data into array with date field
    const appointmentsArray = []
    Object.keys(groupedAppointments).forEach(dateKey => {
      groupedAppointments[dateKey].forEach(apt => {
        appointmentsArray.push({
          ...apt,
          date: dateKey,  // Ensure date is in YYYY-MM-DD format
          motif: apt.motif || 'Consultation'
        })
      })
    })
    
    setCompletedAppointments(appointmentsArray)
    if (data.averagePaid !== undefined) setAveragePaid(data.averagePaid)
    if (data.todayRevenue !== undefined) setCaDay(data.todayRevenue)
    if (data.weekRevenue !== undefined) setCaWeek(data.weekRevenue)
  } catch (error) {
    console.error('Error loading history:', error)
    setCompletedAppointments([])
  } finally {
    setLoading(false)
  }
}
```

## Alternative: Keep Mock Data for Development

If you want to keep the mock data while API is being set up:

```javascript
const loadHistoryData = async () => {
  setLoading(true)
  
  // Try API first
  try {
    let response = await fetch(`${baseURL}/medecin/completed-appointments-grouped`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      credentials: 'include',
    })

    if (response.ok) {
      const data = await response.json()
      
      // Convert grouped data to array
      const groupedAppointments = data.completedApointments || {}
      const appointmentsArray = []
      
      Object.keys(groupedAppointments).forEach(dateKey => {
        groupedAppointments[dateKey].forEach(apt => {
          appointmentsArray.push({
            ...apt,
            date: dateKey,
            motif: apt.motif || 'Consultation'
          })
        })
      })
      
      setCompletedAppointments(appointmentsArray)
      if (data.averagePaid !== undefined) setAveragePaid(data.averagePaid)
      if (data.todayRevenue !== undefined) setCaDay(data.todayRevenue)
      if (data.weekRevenue !== undefined) setCaWeek(data.weekRevenue)
      setLoading(false)
      return
    }
  } catch (error) {
    console.log('API not available, using mock data')
  }
  
  // Fallback to mock data
  const mockData = getMockEnrichedData()
  setCompletedAppointments(mockData)
  setLoading(false)
}
```

## Testing Checklist

1. ✅ **Date navigation works**: Previous/Next/Today buttons
2. ✅ **Consultations display**: Shows for selected date
3. ✅ **Vital signs render**: With correct color coding
4. ✅ **Biological tests show**: With status badges
5. ✅ **Statistics calculate**: Correct counts
6. ✅ **Accordion expands**: Click to show details
7. ✅ **Empty state works**: When no consultations
8. ✅ **Loading state shows**: During data fetch

## Common Issues

### Issue 1: Date Filtering Not Working

**Problem**: Component shows all appointments regardless of selected date

**Solution**: Ensure date comparison uses YYYY-MM-DD format:

```javascript
const getConsultationsForDate = (date) => {
  if (!completedAppointments || !Array.isArray(completedAppointments)) return []
  
  const dateStr = date.toISOString().split('T')[0]
  return completedAppointments.filter(apt => {
    const aptDateStr = typeof apt.date === 'string' && apt.date.includes('T')
      ? apt.date.split('T')[0]
      : apt.date
    return aptDateStr === dateStr
  })
}
```

### Issue 2: Vital Signs Not Showing Colors

**Problem**: All vital signs show gray, no color coding

**Solution**: Ensure vital signs keys match exactly:

Backend provides: `bloodPressureSystolic`, `bloodPressureDiastolic`, `heartRate`, `weight`, `height`, `bmi`, `pcm`

Component expects same keys in `VITAL_SIGNS_NORMALS`

### Issue 3: Biological Tests Status Wrong

**Problem**: Status badges show wrong colors

**Solution**: Backend already provides French status:
- "demandée" → Blue
- "en attente" → Yellow  
- "reçue" → Green

Component expects exactly these values.

### Issue 4: Empty completedAppointments

**Problem**: State shows `{}` instead of `[]`

**Solution**: When using grouped endpoint, convert to array:

```javascript
const appointmentsArray = []
Object.keys(groupedAppointments).forEach(dateKey => {
  groupedAppointments[dateKey].forEach(apt => {
    appointmentsArray.push({ ...apt, date: dateKey })
  })
})
setCompletedAppointments(appointmentsArray)
```

## Production Recommendations

1. **Use Grouped Endpoint**: Faster client-side filtering
2. **Cache Results**: Store in DataProvider context
3. **Refresh Strategy**: Reload on date change or manual refresh
4. **Error Handling**: Show user-friendly messages
5. **Loading States**: Skeleton loaders for better UX
6. **Optimistic Updates**: Show changes immediately

## Performance Tips

1. **Memoize Statistics**: Use `useMemo` for stats calculation
2. **Virtualize List**: For large number of consultations
3. **Lazy Load Details**: Only fetch details when accordion opens
4. **Debounce Search**: If implementing search functionality
5. **Cache Requests**: Use React Query or SWR

## Next Steps

1. ✅ Replace mock data with API calls
2. ✅ Test with real data
3. ⏭️ Add search functionality
4. ⏭️ Add filters (by patient, status, etc.)
5. ⏭️ Add export/print functionality
6. ⏭️ Add pagination for very long histories

---

**Status**: Ready for implementation  
**Last Updated**: 2025-11-09
