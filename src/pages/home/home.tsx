import './home.scss';

import React, { memo } from 'react';

import { Credentials } from '../../types/credentials.types';
import { CalendarHeader } from './components/calendar-header';
import { DateCell } from './components/date-cell';
import { LoginForm } from './components/login-form';
import useHomeHook from './home.hook';
import { LoadingOverlay } from '../../components/loading-overlay';
import Calendar from 'antd/lib/calendar';
import dayjs, { Dayjs } from 'dayjs';

import { CellRenderInfo } from 'rc-picker/lib/interface';

export interface HomeProps {
  /**
   * Defines custom className
   */
  className?: string;
  /**
   * Defines component's custom style
   */
  style?: React.CSSProperties;
  // add new properties here...
}

function HomeComponent(props: HomeProps) {
  const { className, style } = props;

  const {
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
  } = useHomeHook();

  const cellRender = React.useCallback(
    (currentDate: Dayjs, info: CellRenderInfo<Dayjs>): React.JSX.Element => {
      const date = currentDate.toDate();
      const events =
        dataState.data?.calendarEvents?.filter(
          (e) =>
            e.date.getFullYear() === date.getFullYear() &&
            e.date.getMonth() === date.getMonth() &&
            (info.type === 'month' || e.date.getDate() === date.getDate()),
        ) ?? [];

      return <DateCell date={date} events={events} />;
    },
    [dataState.data?.calendarEvents],
  );

  const disableMissingDays = React.useMemo(
    () =>
      !dataState?.status ||
      dataState.status === 'loading' ||
      !epm.dailyMinutes ||
      !epm.activities ||
      !projectsProportions.length ||
      !dataState.data?.combinedData ||
      !Object.entries(dataState.data.combinedData).length ||
      !projectsOptions.every((p) => p.professionalId.length),
    [
      dataState?.data?.combinedData,
      dataState.status,
      epm.activities,
      epm.dailyMinutes,
      projectsOptions,
      projectsProportions.length,
    ],
  );

  return (
    <div className={`home ${className ?? ''}`.trim()} style={style}>
      <LoadingOverlay loading={!dataState?.status || dataState.status === 'loading'} />

      <CalendarHeader value={dayjs(month)} type={calendarType} onChange={onDateChange} onTypeChange={setCalendarType} />

      <div className="home-item home__actions">
        <button disabled={!dataState?.status || dataState.status === 'loading'} onClick={() => getCombinedData(true)}>
          Force data update
        </button>

        <button disabled={disableMissingDays} onClick={() => setShowMissingDaysModal(true)}>
          Add missing days
        </button>

        {dataState.status === 'error' && <span>{dataState.message ?? 'unknown error'}</span>}
      </div>

      <div className="home-item home__projects">
        <div className="project-item">
          <span className="project-item-part project-id">Projects ID</span>
          <span className="project-item-part professional-id">Professional job</span>
          <span className="project-item-part proportion-id">Time proportion</span>
        </div>

        {projectsOptions.map((projectOptions, index) => {
          const projectProportion = projectsProportions.find((pp) => pp.projectId === projectOptions.projectId) ?? {
            projectId: projectOptions.projectId,
            professionalId: projectOptions.professionalId[0]?.id ?? '',
            proportion: 1,
          };

          return (
            <div key={index} className="project-item">
              <div className="project-item-part project-id">
                {projectOptions.projectName ?? projectOptions.projectId}
              </div>

              <select
                className="project-item-part professional-id"
                defaultValue={projectProportion.professionalId}
                disabled={!projectOptions.professionalId.length}
                onChange={(e) => {
                  projectProportion.professionalId = e.target.value;
                  onSetProject(projectProportion);
                }}
              >
                {projectOptions.professionalId.map((professional) => (
                  <option key={professional.id} value={professional.id}>
                    {professional.nome ?? 'unknown'}
                  </option>
                ))}
              </select>

              <input
                className="project-item-part proportion-id"
                type="number"
                defaultValue={projectProportion.proportion}
                disabled={!projectOptions.professionalId.length}
                onChange={(e) => {
                  projectProportion.proportion = Number(e.target.value);
                  onSetProject(projectProportion);
                }}
              />
            </div>
          );
        })}
      </div>

      <Calendar
        className="home-item home__calendar"
        fullscreen
        value={dayjs(month)}
        onChange={onDateChange}
        mode={calendarType}
        // events={dataState.data?.calendarEvents}
        cellRender={cellRender}
        headerRender={() => null}
      />

      {/* Create native modal */}
      <dialog className="credentials-modal" open={credentialsData?.mrhFailed || credentialsData?.epmFailed}>
        <div className="grouped meu-rh">
          <h3>meu RH</h3>
          {credentialsData?.mrhFailed ? (
            <>
              <LoginForm
                kind="mrh"
                credentialsData={credentialsData}
                onURLChange={(url) => {
                  setCredentialsData((p) => ({ ...p, mrhUrl: url }));
                }}
                onCredentialsChange={(c) => {
                  setCredentialsData((p) => ({ ...p, mrhCredentials: c as Credentials }));
                }}
                loginState={meuRHLoginState}
              />

              <label htmlFor="mrh-save-credentials" title="save credentials">
                <input
                  id="mrh-save-credentials"
                  type="checkbox"
                  style={{ marginBottom: '0.5rem' }}
                  onChange={(e) => setCredentialsData((p) => ({ ...p, saveMRHCredentials: e.target.checked }))}
                />
                save credentials
              </label>

              <button onClick={meuRHLogin}>mrh login</button>
            </>
          ) : (
            <span>mrh login ok!</span>
          )}
        </div>

        <div className="grouped epm">
          <h3>EPM</h3>
          {credentialsData?.epmFailed ? (
            <>
              <LoginForm
                kind="epm"
                credentialsData={credentialsData}
                onURLChange={(url) => {
                  setCredentialsData((p) => ({ ...p, epmUrl: url }));
                }}
                onCredentialsChange={(c) => {
                  setCredentialsData((p) => ({ ...p, epmCredentials: c as Credentials }));
                }}
                loginState={epmLoginState}
              />

              <label htmlFor="epm-save-credentials">
                <input
                  id="epm-save-credentials"
                  type="checkbox"
                  style={{ marginBottom: '0.5rem' }}
                  onChange={(e) => setCredentialsData((p) => ({ ...p, saveEPMCredentials: e.target.checked }))}
                />
                save credentials
              </label>
              <button onClick={epmLogin}>EPM login</button>
            </>
          ) : (
            <span>epm login ok!</span>
          )}
        </div>
      </dialog>

      {/* <Modal
        title="Platform credentials"
        visible={credentialsData?.mrhFailed || credentialsData?.epmFailed}
        onOk={() => {
          if (credentialsData?.mrhFailed) meuRHLogin();
          if (credentialsData?.epmFailed) epmLogin();
        }}
        okText="Login all"
        // onCancel={() => setIsModalOpen(false)}
        // cancelText="Secondary button"
      >
        <styled.CredentialsModal>
          <div className="grouped meu-rh">
            <h3>mrh</h3>
            {credentialsData?.mrhFailed ? (
              <>
                <TextInput
                  title="mrh URL"
                  placeholder="mrh URL"
                  style={{ marginBlock: '0.5rem' }}
                  defaultValue={credentialsData.mrhUrl}
                  onChange={(e) => {
                    setCredentialsData((p) => ({ ...p, mrhUrl: e.target.value }));
                  }}
                />

                <LoginForm
                  kind="mrh"
                  credentials={credentialsData.mrhCredentials}
                  onCredentialsChange={(c) => {
                    setCredentialsData((p) => ({ ...p, mrhCredentials: c as Credentials }));
                  }}
                  loginState={meuRHLoginState}
                />
                <Checkbox
                  label="save credentials"
                  style={{ marginBottom: '0.5rem' }}
                  onChange={(e) => setCredentialsData((p) => ({ ...p, saveMRHCredentials: e.target.checked }))}
                />
                <button title="mrh login" onClick={meuRHLogin} />
              </>
            ) : (
              <span>mrh login ok!</span>
            )}
          </div>

          <div className="grouped epm">
            <h3>EPM</h3>
            {credentialsData?.epmFailed ? (
              <>
                <TextInput
                  title="EPM URL"
                  placeholder="EPM URL"
                  style={{ marginBlock: '0.5rem' }}
                  defaultValue={credentialsData.epmUrl}
                  onChange={(e) => {
                    setCredentialsData((p) => ({ ...p, epmUrl: e.target.value }));
                  }}
                />
                <LoginForm
                  kind="epm"
                  credentials={credentialsData.epmCredentials}
                  onCredentialsChange={(c) => {
                    setCredentialsData((p) => ({ ...p, epmCredentials: c as Credentials }));
                  }}
                  loginState={epmLoginState}
                />
                <Checkbox
                  label="save credentials"
                  style={{ marginBottom: '0.5rem' }}
                  onChange={(e) => setCredentialsData((p) => ({ ...p, saveEPMCredentials: e.target.checked }))}
                />
                <button title="EPM login" onClick={epmLogin} />
              </>
            ) : (
              <span>epm login ok!</span>
            )}
          </div>
        </styled.CredentialsModal>
      </Modal>

      <Modal
        title="Add missing days to EPM"
        visible={!disableMissingDays && showMissingDaysModal}
        onOk={() => {
          addMissingDays();
          setShowMissingDaysModal(false);
        }}
        okText="Add selected days"
        onCancel={() => setShowMissingDaysModal(false)}
      >
        <styled.SelectionTable className="selection-table">
          <tbody>
            <tr>
              <th>Include</th>
              <th>Date</th>
              <th>mrh [minutes]</th>
              <th>epm [minutes]</th>
            </tr>

            {Object.entries(dataState?.data?.combinedData ?? {}).map(([key, { date, epmMinutes, meuRHMinutes }]) => (
              <tr key={key} className="minute">
                <td className="minute-include">
                  <Checkbox
                    checked={selectedDates.includes(date)}
                    disabled={epmMinutes > 0}
                    onChange={() => {
                      if (selectedDates.includes(date)) {
                        setSelectedDates(selectedDates.filter((d) => d !== date));
                      } else {
                        setSelectedDates([...selectedDates, date]);
                      }
                    }}
                  />
                </td>
                <td className="minute-key">{key}</td>
                <td className="minute-value">{meuRHMinutes}</td>
                <td className="minute-value">{epmMinutes}</td>
              </tr>
            ))}
          </tbody>
        </styled.SelectionTable>
      </Modal> */}
    </div>
  );
}

export const Home = memo(HomeComponent) as unknown as typeof HomeComponent;
