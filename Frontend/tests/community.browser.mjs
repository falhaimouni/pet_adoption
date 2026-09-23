import assert from "node:assert/strict";
import { chromium } from "playwright";
const base = process.env.TEST_URL ?? "http://127.0.0.1:5173";
const me = "11111111-1111-4111-8111-111111111111";
const friend = "22222222-2222-4222-8222-222222222222";
const vet = "33333333-3333-4333-8333-333333333333";
const cid = "44444444-4444-4444-8444-444444444444";
const person = { id: friend, name: "Other Adopter", email: "adopter@example.test", role: "ADOPTER" };
const newcomer = {id:"55555555-5555-4555-8555-555555555555",name:"New Adopter",role:"ADOPTER"};
const browser = await chromium.launch({ headless: true });
try {
  for (const role of ["adopter", "admin", "manager", "employee", "vet"]) {
    const page = await browser.newPage({
      viewport: { width: 430, height: 900 },
    });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    let blocked = false;
    let requests = [
      { id: cid, senderId: friend, recipientId: me, user: person },
    ];
    let friends = [];
    let messages = [
      {
        id: me,
        text: "My question",
        sender: { id: me, name: "Test User", role: role.toUpperCase() },
        createdAt: "2026-09-23T09:00:00Z",
      },
      {
        id: friend,
        text: "Hello from another adopter",
        sender: person,
        createdAt: "2026-09-23T09:01:00Z",
      },
      {
        id: vet,
        text: "Advice from a vet",
        sender: { id: vet, name: "Helpful Vet", role: "VET" },
        createdAt: "2026-09-23T09:02:00Z",
      },
    ];
    const calls = [];
    await page.addInitScript(
      ({ role, me }) => {
        sessionStorage.setItem(
          "petopia_auth_user",
          JSON.stringify({
            id: me,
            role,
            name: "Test User",
            email: "test@example.test",
          }),
        );
      },
      { role, me },
    );
    await page.route("**/*", (route) => {
      const url = new URL(route.request().url());
      if (url.port !== "3000") return route.continue();
      const path = url.pathname,
        method = route.request().method();
      calls.push({ path, method });
      const reply = (json, status = 200) =>
        route.fulfill({
          status,
          json,
          headers: { "Access-Control-Allow-Origin": "*" },
        });
      if (method === "OPTIONS")
        return route.fulfill({
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Methods": "*",
          },
        });
      if (path === "/users/profile")
        return reply({
          userId: me,
          email: "test@example.test",
          firstName: "Test",
          lastName: "User",
          role: { roleName: role.toUpperCase() },
        });
      if (path === "/notifications/unread-count") return reply({ count: 0 });
      if (path === "/cart/me") return reply({ cartItems: [] });
      if (path === "/presence/heartbeat") return reply({ ok: true });
      if (path === "/community/access") return reply({ blocked });
      if (path === "/community/messages" && method === "GET")
        return reply([...messages].reverse());
      if (path === "/community/messages" && method === "POST") {
        messages.push({
          id: cid,
          text: "New community message",
          sender: { id: me, name: "Test User", role: role.toUpperCase() },
          createdAt: "2026-09-23T09:03:00Z",
        });
        return reply({ id: cid });
      }
      if (path.startsWith("/community/messages/") && method === "DELETE") {
        const m = messages.find((m) => m.id === path.split("/")[3]);
        m.deletedAt = new Date().toISOString();
        m.text = null;
        return reply({ deleted: true });
      }
      if (path === "/community/blocks" && method === "GET")
        return reply([{ user: person }]);
      if (path.startsWith("/community/blocks")) return reply({ ok: true });
      if (path === `/public-profiles/${friend}`) return reply(person);
      if (path === "/friend-requests" && method === "GET")
        return reply(requests);
      if (path === "/friend-requests" && method === "POST")
        return reply({ id: cid });
      if (path.startsWith("/friend-requests/") && method === "PATCH") {
        requests = [];
        friends = [{ id: friend, friend: person, online: true }, {id:newcomer.id,friend:newcomer,online:false}];
        return reply({ ok: true });
      }
      if (path === "/adopters/search") return reply([newcomer]);
      if (path === "/friends") return reply(friends);
      if (path === "/direct-conversations" && method === "POST")
        return reply({ id: cid });
      if (path === "/direct-conversations")
        return reply([
          {
            id: cid,
            friend: person,
            canSend: true,
            lastMessage: "Private hello",
          },
        ]);
      if (path === `/direct-conversations/${cid}/messages` && method === "GET")
        return reply([
          {
            id: friend,
            senderId: friend,
            text: "Private hello",
            createdAt: "2026-09-23T09:00:00Z",
          },
        ]);
      if (path.startsWith("/direct-conversations/")) return reply({ ok: true });
      if (path === "/conversations" && method === "POST") return reply({conversationId:cid});
      if (path === `/conversations/${cid}`) return reply({conversationId:cid,messages:[],status:"OPEN"});
      if (path.startsWith(`/conversations/${cid}/`)) return reply({ok:true});
      if (path === "/conversations/my") return reply([]);
      return reply({ message: "No fixture" }, 404);
    });
    await page.goto(`${base}/#/community`);
    await page.getByText("Advice from a vet", { exact: true }).waitFor();
    assert.equal(
      await page
        .getByRole("button", { name: "Helpful Vet Vet", exact: true })
        .isDisabled(),
      true,
    );
    assert.equal(await page.getByText("Vet", { exact: true }).count(), 1);
    await page
      .getByLabel("Community message", { exact: true })
      .fill("New community message");
    await page.getByRole("button", { name: "Send", exact: true }).click();
    await page.getByText("New community message", { exact: true }).waitFor();
    await page
      .locator("article")
      .filter({ hasText: "My question" })
      .getByRole("button", { name: "Message options", exact: true })
      .click();
    await page.getByRole("menuitem", {name:"Delete",exact:true}).click();
    await page
      .getByText("This message has been deleted.", { exact: true })
      .waitFor();
    if (role === "adopter") {
      await page
        .getByRole("button", { name: "Other Adopter", exact: true })
        .click();
      await page.getByRole("dialog").waitFor();
      await page.getByText("adopter@example.test", {exact:true}).waitFor();
      assert.equal(await page.getByRole("button", {name:"Close profile"}).textContent(), "");
      await page
        .getByRole("button", { name: "Send friend request", exact: true })
        .click();
      await page.getByText("Friend request sent", { exact: true }).waitFor();
      await page.getByRole("button", { name: "Close profile" }).click();
      await page.goto(`${base}/#/friends`);
      await page.getByRole("tab", {name:"Friends",exact:true}).waitFor();
      await page.getByText("You don't have any friends yet.", {exact:true}).waitFor();
      await page.getByLabel("Search adopters by name").fill("New");
      await page.getByRole("button", {name:"Add friend",exact:true}).waitFor();
      await page.getByText("New Adopter",{exact:true}).waitFor();
      await page.getByLabel("Search adopters by name").fill("");
      await page.getByRole("tab", {name:"Requests",exact:true}).click();
      await page.getByRole("button", { name: "Accept", exact: true }).click();
      await page.getByRole("tab", {name:"Friends",exact:true}).click();
      await page.getByText("● Online", { exact: true }).waitFor();
      await page.getByRole("button", { name: "Chat", exact: true }).first().click();
      await page
        .getByLabel("Private messages")
        .getByText("Private hello", { exact: true })
        .waitFor();
      assert.equal(await page.getByLabel("Search friends").count(),0);
      await page.getByRole("button",{name:"← Back to chats",exact:true}).click();
      await page.getByLabel("Search friends").fill("New");
      await page.getByRole("button", {name:/New Adopter Offline Start chatting/}).waitFor();
      await page.getByLabel("Search friends").fill("");
      assert.equal(await page.getByLabel("Private messages").count(),0);
      await page.getByRole("button",{name:/Other Adopter Online Private hello/}).click();
      await page
        .getByLabel("Private message", { exact: true })
        .fill("Hello privately");
      await page.getByRole("button", { name: "Send", exact: true }).click();
      await page
        .getByLabel("Private message", { exact: true })
        .filter({ hasText: "" })
        .waitFor();
      await Promise.all([
        page.waitForResponse(response => response.url().endsWith('/conversations')),
        page.getByRole("button", { name: "Open Support Chat", exact: true }).click(),
      ]);
      await page.waitForURL("**/#/chat-detail/**");
      assert.ok(calls.some((c) => c.path === "/conversations" && c.method === "POST"));
      blocked = true;
      await page.goto(`${base}/#/community`);
      await page
        .getByText("You are blocked from Community.", { exact: true })
        .waitFor();
      assert.equal(
        await page.getByLabel("Community message", { exact: true }).count(),
        0,
      );
    } else if (["admin","manager","employee"].includes(role)) {
      await page.getByRole("button", { name: "Manage blocked users" }).click();
      await page.getByRole("button", { name: "Unblock", exact: true }).click();
      await page.getByRole("dialog").getByRole("button", {name:"Close",exact:true}).click();
      await page
        .locator("article")
        .filter({ hasText: "Hello from another adopter" })
        .getByRole("button", { name: "Message options", exact: true })
        .click();
      await page.getByRole("menuitem", {name:"Block user",exact:true}).waitFor();
      await page.getByRole("menuitem", {name:"Delete",exact:true}).click();
      await page.getByText("This message has been deleted.", {exact:true}).nth(1).waitFor();
    } else {
      await page.locator("article").filter({hasText:"Hello from another adopter"}).getByRole("button", {name:"Message options"}).click();
      await page.getByRole("menuitem", {name:"Reply", exact:true}).waitFor();
      assert.equal(await page.getByRole("menuitem", {name:"Delete",exact:true}).count(),0);
      assert.equal(await page.getByRole("menuitem", {name:"Block user",exact:true}).count(),0);
      await page.keyboard.press('Escape');
      assert.equal(
        await page
          .getByRole("button", { name: "Manage blocked users" })
          .count(),
        0,
      );
      assert.equal(
        await page
          .locator("article")
          .filter({ hasText: "Hello from another adopter" })
          .getByRole("button", { name: "Delete", exact: true })
          .count(),
        0,
      );
    }
    assert.deepEqual(errors, []);
    await page.close();
  }
  console.log(
    "Community, Friends, Private Chat, Support entry point, and role UI checks passed.",
  );
} finally {
  await browser.close();
}
