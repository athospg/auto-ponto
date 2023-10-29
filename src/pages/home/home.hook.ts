import React from 'react';

import { CalendarMode } from 'antd/lib/calendar/generateCalendar';
import { Dayjs } from 'dayjs';

import { useLoginHook } from '../../hooks/useLogin';
import { EpmAtividadesProjetoProfissional } from '../../types/epm.types';
import { Project } from '../../types/projects';
import { LoadingState } from '../../types/utils.types';
import { CookieUtils } from '../../utils/cookieUtils';
import { createDateAsUTC } from '../../utils/date.utils';
import { FormatUtils } from '../../utils/format.utils';
import EPM from './services/epm';
import MeuRH from './services/meu-rh';

export interface CombinedData {
  date: Date;
  meuRHMinutes: number;
  meuRHAppointments: number;
  epmMinutes: number;
}

export type Event = {
  kind: 'mrh' | 'epm';
  date: Date;
  duration: number;
  description: string;
  appointments?: number;
};

export interface DataState {
  combinedData: Record<string, CombinedData>;
  calendarEvents: Event[];
}

export interface ProjectOptions {
  projectId: string;
  projectName: string;
  professionalId: EpmAtividadesProjetoProfissional[];
}

function useHomeHook() {
  const [month, setMonth] = React.useState<Date>(new Date());
  const [calendarType, setCalendarType] = React.useState<CalendarMode>('month');
  const [showMissingDaysModal, setShowMissingDaysModal] = React.useState<boolean>(false);
  const [selectedDates, setSelectedDates] = React.useState<Date[]>([]);

  const [dataState, setDataState] = React.useState<LoadingState<DataState>>({ status: 'loading' });

  const [projectsOptions, setProjectsOptions] = React.useState<ProjectOptions[]>([]);
  const [projectsProportions, setProjectsProportions] = React.useState<Project[]>(() => {
    const projectsStr = CookieUtils.getCookie('projectProportions');
    return !projectsStr ? [] : (JSON.parse(projectsStr) as Project[]);
  });

  const onDateChange = React.useCallback(
    (newDate: Dayjs | null | undefined) => {
      if (!newDate) return;
      const date = newDate.toDate();
      if (date.getMonth() === month.getMonth() && date.getFullYear() === month.getFullYear()) return;

      setSelectedDates([]);
      setMonth(date);
    },
    [month],
  );

  const {
    meuRHLoginState,
    epmLoginState,
    credentialsData,
    meuRHClient,
    epmClient,
    meuRHLogin,
    epmLogin,
    setCredentialsData,
  } = useLoginHook();

  const preloadCount = 3;

  const mrh = React.useMemo(() => {
    const mrh = new MeuRH(meuRHClient);
    mrh.preloadCount = preloadCount;
    return mrh;
  }, [meuRHClient]);
  const epm = React.useMemo(() => {
    const e = new EPM(epmClient);
    e.preloadCount = preloadCount;
    return e;
  }, [epmClient]);

  const meuRHGetMinutes = React.useCallback(
    async (ignoreCache?: boolean) => {
      const minutes = await mrh.getDailyMinutes(ignoreCache);
      if (!('code' in minutes)) {
        return minutes;
      }

      setCredentialsData((c) => ({ ...(c ?? {}), mrhFailed: true }));
      return null;
    },
    [mrh, setCredentialsData],
  );

  const epmGetActivities = React.useCallback(
    async (ignoreCache?: boolean) => {
      const activities = await epm.getActivities(ignoreCache);
      if (!('code' in activities)) {
        return activities;
      }

      setCredentialsData((c) => ({ ...(c ?? {}), epmFailed: true }));
      return null;
    },
    [epm, setCredentialsData],
  );

  const getCombinedData = React.useCallback(
    async (ignoreCache?: boolean) => {
      setDataState({ status: 'loading' });

      const [mrhMinutes, epmActivities] = await Promise.all([
        meuRHGetMinutes(ignoreCache),
        epmGetActivities(ignoreCache),
      ]);
      if (!mrhMinutes || !epmActivities) {
        setDataState({ status: 'error', message: 'Failed to get data' });
        return;
      }

      epm.dailyMinutes = mrhMinutes;
      epm.activities = epmActivities;

      setProjectsOptions(
        epmActivities.projetos.map((p) => ({
          projectId: p.projetoId,
          projectName: p.projetoNome,
          professionalId: p.epmAtividadesProjetoProfissional,
        })),
      );

      const combinedData: Record<string, CombinedData> = {};
      const convertHourToMinutes = (hour: string) => {
        const [h, m] = hour.split(':').map((n) => parseInt(n, 10));
        return h * 60 + m;
      };
      Object.entries(mrhMinutes).forEach(([date, { minutes, appointments }]) => {
        combinedData[date] = {
          date: new Date(date),
          meuRHMinutes: minutes,
          meuRHAppointments: appointments,
          epmMinutes: epmActivities.somaAtividades
            .filter((a) => a.diaMesAno === date)
            .reduce((acc, a) => acc + convertHourToMinutes(a.totalHorasNoDia), 0),
        };
      });

      const missingDays = Object.entries(combinedData)
        .filter(([, data]) => data.meuRHMinutes > 0 && data.epmMinutes === 0)
        .map(([, data]) => data.date);
      setSelectedDates(missingDays);

      const calendarEvents: Event[] = Object.entries(mrhMinutes).map(([date, { minutes, appointments, pending }]) => ({
        kind: 'mrh',
        date: createDateAsUTC(new Date(date)),
        duration: minutes,
        description: `mrh: ${FormatUtils.formatMinutes(minutes)}`,
        appointments,
        pending,
      }));
      epmActivities.somaAtividades.forEach((a) => {
        const date = createDateAsUTC(new Date(a.diaMesAno));
        calendarEvents.push({
          kind: 'epm',
          date,
          duration: convertHourToMinutes(a.totalHorasNoDia),
          description: `EPM: ${a.totalHorasNoDia}`,
        });
      });
      calendarEvents.sort((a, b) => a.date.getTime() - b.date.getTime());

      setDataState({ status: 'loaded', data: { combinedData, calendarEvents } });
    },
    [meuRHGetMinutes, epmGetActivities, epm],
  );

  const onSetProject = React.useCallback(
    (updateProject: Project) => {
      let project = projectsProportions.find((p) => p.projectId === updateProject.projectId);
      if (!project) {
        project = { ...updateProject };
        projectsProportions.push(project);
      } else {
        project.professionalId = updateProject.professionalId;
        project.proportion = updateProject.proportion;
      }

      setProjectsProportions(projectsProportions);
      CookieUtils.setCookie('projectProportions', JSON.stringify(projectsProportions), 365);
    },
    [projectsProportions],
  );

  React.useEffect(() => {
    if (credentialsData?.epmFailed || credentialsData?.mrhFailed) {
      return;
    }

    mrh.year = month.getFullYear();
    mrh.month = month.getMonth() + 1;
    epm.year = month.getFullYear();
    epm.month = month.getMonth() + 1;

    getCombinedData();
  }, [credentialsData?.epmFailed, credentialsData?.mrhFailed, epm, getCombinedData, mrh, month]);

  const addMissingDays = React.useCallback(async () => {
    if (!projectsProportions.length) return;

    await epm.createMissingDays(projectsProportions, selectedDates);
    await getCombinedData();
  }, [epm, getCombinedData, projectsProportions, selectedDates]);

  return {
    month,
    calendarType,
    credentialsData,
    showMissingDaysModal,
    selectedDates,
    projectsOptions,
    projectsProportions,
    mrh,
    epm,
    dataState,
    meuRHLoginState,
    epmLoginState,
    setCalendarType,
    setShowMissingDaysModal,
    setSelectedDates,
    onDateChange,
    meuRHLogin,
    epmLogin,
    getCombinedData,
    addMissingDays,
    onSetProject,
    setCredentialsData,
  };
}

export default useHomeHook;
