const api = "https://api.github.com/graphql"

async function tham(token, query, vars) {
  const res = await fetch(api, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables: vars }),
  })
  if (res.status !== 200) throw new Error(`graphql http ${res.status}`)
  const body = await res.json()
  if (body.errors?.length) throw new Error(`graphql: ${body.errors[0].message}`)
  if (!body.data) throw new Error("graphql: no data")
  return body.data
}

function lek(n, name) {
  if (typeof n !== "number" || !Number.isFinite(n)) throw new Error(`bad number: ${name}`)
  return n
}

async function nubdao(token, login) {
  let nub = 0
  let after = null
  for (;;) {
    const d = await tham(
      token,
      `query($login:String!,$after:String){user(login:$login){repositories(first:100,after:$after,ownerAffiliations:OWNER){nodes{stargazerCount}pageInfo{hasNextPage endCursor}}}}`,
      { login, after },
    )
    const r = d.user.repositories
    for (const n of r.nodes) nub += lek(n.stargazerCount, "stargazerCount")
    if (!r.pageInfo.hasNextPage) return nub
    after = r.pageInfo.endCursor
  }
}

export async function dustat(token, login) {
  if (!token) throw new Error("no token")
  const a = await tham(
    token,
    `query($login:String!){user(login:$login){createdAt followers{totalCount} repositories(ownerAffiliations:OWNER){totalCount}}}`,
    { login },
  )
  const since = String(a.user.createdAt).slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(since)) throw new Error("bad date: createdAt")
  return {
    repos: lek(a.user.repositories.totalCount, "repos"),
    stars: await nubdao(token, login),
    followers: lek(a.user.followers.totalCount, "followers"),
    since,
  }
}
