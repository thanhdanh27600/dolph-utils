import { getForwardUrl } from 'api/requests';
import mixpanel from 'mixpanel-browser';
import { GetServerSidePropsContext } from 'next';
import Head from 'next/head';
import { useEffect } from 'react';
import requestIp from 'request-ip';
import { BASE_URL } from 'types/constants';
import { MIXPANEL_EVENT, MIXPANEL_STATUS } from 'types/utils';

const ForwardURL = ({ url, hash, error }: { url?: string; hash?: string; error?: unknown }) => {
  useEffect(() => {
    if (typeof window === undefined) {
      return;
    }
    if (!url) {
      mixpanel.track(MIXPANEL_EVENT.FORWARD, {
        status: MIXPANEL_STATUS.FAILED,
        error,
      });
      location.replace('/');

      return;
    }
    try {
      mixpanel.track(MIXPANEL_EVENT.FORWARD, {
        status: MIXPANEL_STATUS.OK,
        urlRaw: url,
        hash,
      });
    } catch (error) {}
    location.replace(`${url.includes('http') ? '' : '//'}${url}`);
  }, [url]);

  return (
    <>
      <Head>
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://facebook.com/clickditop/ " />
        <meta property="og:title" content="Clickdi - Share link like a pro." />
        <meta
          property="og:description"
          content="Clickdi is more than a URL shortener, help you track the usage of the shortened URLs, providing analytics on the number of clicks, geographic location of clicks, and other relevant data. Take action on the effectiveness of shared links and make data-driven decisions to improve their outreach efforts."
        />
        <meta
          property="og:image"
          content={BASE_URL + '/api/og' + encodeURI(`?title=Shared link <${hash}>. Click now!`)}
        />
        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://twitter.com/clickditop" />
        <meta property="twitter:title" content="Clickdi - Share link like a pro." />
        <meta
          property="twitter:description"
          content="Clickdi is more than a URL shortener, help you track the usage of the shortened URLs, providing analytics on the number of clicks, geographic location of clicks, and other relevant data. Take action on the effectiveness of shared links and make data-driven decisions to improve their outreach efforts."
        />
        <meta
          property="twitter:image"
          content={BASE_URL + '/api/og' + encodeURI(`?title=Shared link <${hash}>. Click now!`)}
        />
      </Head>

      {error ? <p>Sorry, something got wrong :(</p> : <></>}
    </>
  );
};

// This gets called on every request
export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { hash } = context.query;
  try {
    const ip = requestIp.getClientIp(context.req);
    const forwardUrl = await getForwardUrl({
      hash: hash ? (hash[0] as string) : '',
      userAgent: context.req.headers['user-agent'],
      ip,
    });
    return { props: { url: forwardUrl.history?.url, hash: hash ? (hash[0] as string) : '' } };
  } catch (error: any) {
    console.log('ForwardURL error', error);
    return { props: { error: error.message || 'Something wrong happened' } };
  }
}

export default ForwardURL;
