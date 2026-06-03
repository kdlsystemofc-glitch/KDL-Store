'use client'
import { useContext } from 'react'
import { PermissionsContext } from '@/app/(dashboard)/layout'

export function usePermissao() {
  return useContext(PermissionsContext)
}
