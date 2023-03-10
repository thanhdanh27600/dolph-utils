import clsx from 'clsx';
import { DropdownIndicate } from 'components/icons/DropdownIndicate';
import { UsaIcon } from 'components/icons/UsaIcon';
import { VietnamIcon } from 'components/icons/VietnamIcon';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { languages, Locale, locales } from 'types/locale';
import { useTrans } from 'utils/i18next';

const LangugageIcon: Record<Locale, (props: any) => JSX.Element> = {
  vi: VietnamIcon,
  en: UsaIcon,
};

const LanguageOptions = ({ changeLanguage, setOpen }: { changeLanguage: (l: string) => void; setOpen: any }) => (
  <>
    {Object.keys(locales).map((lan) => {
      const Icon = LangugageIcon[lan as Locale];
      return (
        <li className="ml-0 list-none" key={lan}>
          <button
            onClick={() => {
              changeLanguage(lan);
              setOpen(false);
            }}
            type="button"
            className="inline-flex w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-100">
            <div className="inline-flex items-center">
              <Icon width={20} className="mr-2" />
              {languages[lan as Locale]}
            </div>
          </button>
        </li>
      );
    })}
  </>
);

export const LanguageSelect = () => {
  const router = useRouter();
  const { i18n } = useTrans();
  const [open, setOpen] = useState(false);

  const currentLanguage = i18n.language as Locale;
  const Icon = LangugageIcon[currentLanguage];

  const changeLanguage = (newLocale: string) => {
    const { pathname, asPath, query } = router;
    router.push({ pathname, query }, asPath, { locale: newLocale });
  };

  if (!currentLanguage) return null;

  return (
    <div className="flex">
      <button
        onClick={() => {
          setOpen((prev) => !prev);
        }}
        className="z-10 inline-flex w-20 flex-shrink-0 items-center rounded-lg border border-gray-300 bg-gray-50 py-2.5 px-4 text-center text-sm font-medium text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-4 focus:ring-gray-100 md:w-36"
        type="button">
        <div className="flex w-full items-center gap-2">
          <Icon className="h-4" />
          <span className="hidden md:block">{languages[currentLanguage]}</span>
        </div>
        <DropdownIndicate />
      </button>
      <div
        className={clsx(
          'absolute inset-x-auto z-10 m-0 hidden w-44 divide-y divide-gray-100 rounded-lg bg-white shadow-xl',
          open && '!block translate-y-[46px] -translate-x-24 md:-translate-x-8',
        )}>
        <ul className="text-sm text-gray-900" aria-labelledby="states-button">
          <LanguageOptions changeLanguage={changeLanguage} setOpen={setOpen} />
        </ul>
      </div>
    </div>
  );
};
